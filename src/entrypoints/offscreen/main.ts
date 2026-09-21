import { browser } from 'wxt/browser'
import { NeutralCalibrator } from '../../core/calibration'
import { GestureInterpreter } from '../../core/gestureInterpreter'
import { MetricsTracker } from '../../core/metrics'
import type { HeadPoseSample, ScrollIntent } from '../../core/types'
import {
  isOffscreenCommand,
  type OffscreenEvent,
  type OffscreenResponse,
  type PipelineSnapshot,
  type RuntimeMetrics,
  type SessionPhase,
} from '../../extension/messages'
import { cameraFailureMessage, namedError } from '../../extension/sessionSafety'
import type { ExtensionSettings } from '../../extension/settings'
import { CameraPipeline, type CameraDetails } from '../../vision/cameraPipeline'
import type { DetectionFrame } from '../../vision/facePoseDetector'

const calibrator = new NeutralCalibrator()
const interpreter = new GestureInterpreter()
const metricsTracker = new MetricsTracker()
let running = false
let phase: SessionPhase = 'IDLE'
let tabId: number | null = null
let tabTitle: string | null = null
let facePresent = false
let calibrationProgress = 0
let statusMessage = 'Pipeline local desligado.'
let lastProgressBucket = -1
let lastIntent: ScrollIntent['action'] = 'NEUTRAL'
let lastMetricsAt = 0
let runtimeMetrics: RuntimeMetrics | null = null
let cameraDetails: CameraDetails = { width: null, height: null, frameRate: null }
let permissionStatus: PermissionStatus | null = null

const pipeline = new CameraPipeline({
  onFrame: handleFrame,
  onCameraReady: (details) => { cameraDetails = details },
  onError: handlePipelineError,
})

browser.runtime.onMessage.addListener((message) => {
  if (!isOffscreenCommand(message)) return undefined

  switch (message.type) {
    case 'START_PIPELINE':
      return start(message.settings, message.tabId, message.tabTitle)
    case 'STOP_PIPELINE':
      stop()
      return Promise.resolve({ ok: true } satisfies OffscreenResponse)
    case 'RESUME_PIPELINE':
      resume()
      return Promise.resolve({ ok: true } satisfies OffscreenResponse)
    case 'RECALIBRATE':
      recalibrate()
      return Promise.resolve({ ok: true } satisfies OffscreenResponse)
    case 'UPDATE_SETTINGS':
      applySettings(message.settings)
      return Promise.resolve({ ok: true } satisfies OffscreenResponse)
    case 'GET_PIPELINE_STATE':
      return Promise.resolve({ ok: true, snapshot: snapshot() } satisfies OffscreenResponse)
  }
})

async function start(
  settings: ExtensionSettings,
  targetTabId: number,
  targetTabTitle: string,
): Promise<OffscreenResponse> {
  if (running) stop()
  tabId = targetTabId
  tabTitle = targetTabTitle
  applySettings(settings)
  metricsTracker.reset()
  runtimeMetrics = null
  lastMetricsAt = 0
  phase = 'STARTING'
  await emitStatus('Carregando o detector local e iniciando a câmera…')

  try {
    await pipeline.start()
    running = true
    await watchCameraPermission()
    beginCalibration()
    return { ok: true }
  } catch (reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    return { ok: false, error: error.message, errorName: error.name }
  }
}

function stop(): void {
  running = false
  clearPermissionWatcher()
  pipeline.stop()
  calibrator.reset()
  interpreter.reset()
  metricsTracker.reset()
  phase = 'IDLE'
  facePresent = false
  calibrationProgress = 0
  statusMessage = 'Pipeline local desligado.'
  lastProgressBucket = -1
  lastIntent = 'NEUTRAL'
  runtimeMetrics = null
  cameraDetails = { width: null, height: null, frameRate: null }
  void emitIntent(interpreter.reset())
  tabId = null
  tabTitle = null
}

function recalibrate(): void {
  if (!running) return
  beginCalibration()
}

function resume(): void {
  if (!running || phase !== 'PAUSED') return
  interpreter.reset()
  lastIntent = 'NEUTRAL'
  phase = 'ACTIVE'
  void emitIntent(interpreter.reset())
  void emitStatus('Controle reativado. Retorne ao neutro antes do próximo gesto.')
}

function beginCalibration(): void {
  calibrator.start(performance.now())
  interpreter.reset()
  phase = 'CALIBRATING'
  calibrationProgress = 0
  lastProgressBucket = -1
  lastIntent = 'NEUTRAL'
  void emitIntent(interpreter.reset())
  void emitStatus('Mantenha uma postura confortável enquanto definimos a posição neutra.')
}

function applySettings(settings: ExtensionSettings): void {
  interpreter.setSensitivity(settings.sensitivity)
  lastIntent = 'NEUTRAL'
  void emitIntent(interpreter.reset())
}

function handleFrame(frame: DetectionFrame): void {
  if (!running) return

  const faceChanged = facePresent !== frame.facePresent
  facePresent = frame.facePresent

  if (phase === 'CALIBRATING') {
    recordMetrics(frame, 'NEUTRAL')
    const calibration = calibrator.add(frame.sample ?? missingSample(frame.timestamp))
    const progress = Math.min(1, calibration.elapsedMs / 5_000)
    const progressBucket = Math.floor(progress * 20)

    if (calibration.status === 'CALIBRATED') {
      phase = 'ACTIVE'
      void emitStatus('Controle ativo nesta aba. O popup pode ser fechado.', 1)
    } else if (calibration.status === 'FAILED') {
      running = false
      clearPermissionWatcher()
      pipeline.stop()
      phase = 'ERROR'
      void emitIntent(interpreter.reset())
      void emitStatus(calibration.message)
      return
    } else if (faceChanged || progressBucket !== lastProgressBucket) {
      lastProgressBucket = progressBucket
      void emitStatus(calibration.message, progress)
    }
    return
  }

  if (phase !== 'ACTIVE') {
    recordMetrics(frame, 'NEUTRAL')
    return
  }

  if (!frame.sample || frame.sample.confidence < 0.5) {
    recordMetrics(frame, 'NEUTRAL')
    phase = 'PAUSED'
    lastIntent = 'NEUTRAL'
    void emitIntent(interpreter.reset())
    void emitStatus('Face perdida: scroll pausado. Use Retomar quando estiver enquadrado.')
    return
  }

  const intent = interpreter.update(frame.sample, calibrator.getBaseline())
  recordMetrics(frame, intent.action)
  void emitIntent(intent)

  if (faceChanged || intent.action !== lastIntent) {
    lastIntent = intent.action
    const message = intent.action === 'NEUTRAL'
      ? 'Controle ativo e em posição neutra.'
      : `Rolando para ${intent.action === 'UP' ? 'cima' : 'baixo'}.`
    void emitStatus(message, 1, intent.action)
  }
}

function recordMetrics(frame: DetectionFrame, action: ScrollIntent['action']): void {
  metricsTracker.record(frame.timestamp, frame.latencyMs, action, frame.facePresent)
  if (frame.timestamp - lastMetricsAt < 1_000) return

  lastMetricsAt = frame.timestamp
  runtimeMetrics = {
    ...metricsTracker.snapshot(),
    memoryMb: readMemoryMb(),
    cameraWidth: cameraDetails.width,
    cameraHeight: cameraDetails.height,
    cameraFrameRate: cameraDetails.frameRate,
  }
}

function handlePipelineError(error: Error): void {
  running = false
  clearPermissionWatcher()
  phase = 'ERROR'
  facePresent = false
  lastIntent = 'NEUTRAL'
  void emitIntent(interpreter.reset())
  void emitStatus(cameraFailureMessage(error))
}

async function watchCameraPermission(): Promise<void> {
  if (!navigator.permissions) return

  try {
    permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
    permissionStatus.onchange = () => {
      if (permissionStatus?.state === 'granted' || !running) return
      pipeline.stop()
      handlePipelineError(namedError('NotAllowedError', 'A permissão da câmera foi revogada.'))
    }
  } catch {
    permissionStatus = null
  }
}

function clearPermissionWatcher(): void {
  if (permissionStatus) permissionStatus.onchange = null
  permissionStatus = null
}

function missingSample(timestamp: number): HeadPoseSample {
  return { pitch: 0, yaw: 0, roll: 0, confidence: 0, timestamp }
}

function snapshot(): PipelineSnapshot {
  return {
    running,
    tabId,
    tabTitle,
    status: {
      phase,
      message: statusMessage,
      facePresent,
      calibrationProgress,
      intent: lastIntent,
      metrics: runtimeMetrics,
    },
  }
}

async function emitIntent(intent: ScrollIntent): Promise<void> {
  if (tabId === null) return
  const event: OffscreenEvent = { target: 'background', type: 'SCROLL_INTENT', tabId, intent }
  await browser.runtime.sendMessage(event).catch(() => undefined)
}

async function emitStatus(
  message: string,
  progress = phase === 'ACTIVE' ? 1 : 0,
  intent: ScrollIntent['action'] = lastIntent,
): Promise<void> {
  statusMessage = message
  calibrationProgress = progress
  const event: OffscreenEvent = {
    target: 'background',
    type: 'OFFSCREEN_STATUS',
    status: {
      phase,
      message,
      facePresent,
      calibrationProgress,
      intent,
      metrics: runtimeMetrics,
    },
  }
  await browser.runtime.sendMessage(event).catch(() => undefined)
}

function readMemoryMb(): number | null {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory
  return typeof memory?.usedJSHeapSize === 'number'
    ? memory.usedJSHeapSize / (1024 * 1024)
    : null
}
