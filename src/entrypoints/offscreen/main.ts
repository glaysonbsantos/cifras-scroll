import { browser } from 'wxt/browser'
import { NeutralCalibrator } from '../../core/calibration'
import { GestureInterpreter } from '../../core/gestureInterpreter'
import type { HeadPoseSample, ScrollIntent } from '../../core/types'
import {
  isOffscreenCommand,
  type OffscreenEvent,
  type SessionPhase,
} from '../../extension/messages'
import type { ExtensionSettings } from '../../extension/settings'
import { CameraPipeline } from '../../vision/cameraPipeline'
import type { DetectionFrame } from '../../vision/facePoseDetector'

const video = requiredVideo()

const calibrator = new NeutralCalibrator()
const interpreter = new GestureInterpreter()
let running = false
let phase: SessionPhase = 'IDLE'
let facePresent = false
let lastProgressBucket = -1
let lastIntent: ScrollIntent['action'] = 'NEUTRAL'

const pipeline = new CameraPipeline({
  onFrame: handleFrame,
  onCameraReady: () => undefined,
  onError: handlePipelineError,
})

browser.runtime.onMessage.addListener((message) => {
  if (!isOffscreenCommand(message)) return undefined

  switch (message.type) {
    case 'START_PIPELINE':
      return start(message.settings)
    case 'STOP_PIPELINE':
      stop()
      return Promise.resolve({ ok: true })
    case 'RESUME_PIPELINE':
      resume()
      return Promise.resolve({ ok: true })
    case 'RECALIBRATE':
      recalibrate()
      return Promise.resolve({ ok: true })
    case 'UPDATE_SETTINGS':
      applySettings(message.settings)
      return Promise.resolve({ ok: true })
  }
})

async function start(settings: ExtensionSettings): Promise<{ ok: boolean; error?: string }> {
  if (running) stop()
  applySettings(settings)
  phase = 'STARTING'
  await emitStatus('Carregando o detector local e iniciando a câmera…')

  try {
    await pipeline.start(video)
    running = true
    beginCalibration()
    return { ok: true }
  } catch (reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    return { ok: false, error: error.message }
  }
}

function stop(): void {
  running = false
  pipeline.stop(video)
  calibrator.reset()
  interpreter.reset()
  phase = 'IDLE'
  facePresent = false
  lastProgressBucket = -1
  lastIntent = 'NEUTRAL'
  void emitIntent(interpreter.reset())
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
  lastProgressBucket = -1
  lastIntent = 'NEUTRAL'
  void emitIntent(interpreter.reset())
  void emitStatus('Mantenha uma postura confortável enquanto definimos a posição neutra.')
}

function applySettings(settings: ExtensionSettings): void {
  interpreter.setSensitivity(settings.sensitivity)
  void emitIntent(interpreter.reset())
}

function handleFrame(frame: DetectionFrame): void {
  if (!running) return

  const faceChanged = facePresent !== frame.facePresent
  facePresent = frame.facePresent

  if (phase === 'CALIBRATING') {
    const calibration = calibrator.add(frame.sample ?? missingSample(frame.timestamp))
    const progress = Math.min(1, calibration.elapsedMs / 5_000)
    const progressBucket = Math.floor(progress * 20)

    if (calibration.status === 'CALIBRATED') {
      phase = 'ACTIVE'
      void emitStatus('Controle ativo nesta aba. O popup pode ser fechado.')
    } else if (calibration.status === 'FAILED') {
      running = false
      pipeline.stop(video)
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

  if (phase !== 'ACTIVE') return

  if (!frame.sample || frame.sample.confidence < 0.5) {
    phase = 'PAUSED'
    lastIntent = 'NEUTRAL'
    void emitIntent(interpreter.reset())
    void emitStatus('Face perdida: scroll pausado. Use Retomar quando estiver enquadrado.')
    return
  }

  const intent = interpreter.update(frame.sample, calibrator.getBaseline())
  void emitIntent(intent)

  if (faceChanged || intent.action !== lastIntent) {
    lastIntent = intent.action
    const message = !facePresent
      ? 'Face não detectada; scroll interrompido imediatamente.'
      : intent.action === 'NEUTRAL'
        ? 'Controle ativo e em posição neutra.'
        : `Rolando para ${intent.action === 'UP' ? 'cima' : 'baixo'}.`
    void emitStatus(message, 1, intent.action)
  }
}

function handlePipelineError(error: Error): void {
  running = false
  phase = 'ERROR'
  facePresent = false
  void emitIntent(interpreter.reset())
  void emitStatus(cameraErrorMessage(error))
}

function missingSample(timestamp: number): HeadPoseSample {
  return { pitch: 0, yaw: 0, roll: 0, confidence: 0, timestamp }
}

async function emitIntent(intent: ScrollIntent): Promise<void> {
  const event: OffscreenEvent = { target: 'background', type: 'SCROLL_INTENT', intent }
  await browser.runtime.sendMessage(event).catch(() => undefined)
}

async function emitStatus(
  message: string,
  calibrationProgress = phase === 'ACTIVE' ? 1 : 0,
  intent: ScrollIntent['action'] = lastIntent,
): Promise<void> {
  const event: OffscreenEvent = {
    target: 'background',
    type: 'OFFSCREEN_STATUS',
    status: { phase, message, facePresent, calibrationProgress, intent },
  }
  await browser.runtime.sendMessage(event).catch(() => undefined)
}

function cameraErrorMessage(error: Error): string {
  if (error.name === 'NotAllowedError') return 'Acesso à câmera negado. Autorize o vídeo e tente novamente.'
  if (error.name === 'NotFoundError') return 'Nenhuma câmera de vídeo foi encontrada.'
  if (error.name === 'NotReadableError') return 'A câmera está ocupada ou indisponível.'
  return `A sessão foi interrompida: ${error.message}`
}

function requiredVideo(): HTMLVideoElement {
  const element = document.querySelector<HTMLVideoElement>('#camera')
  if (!element) throw new Error('Elemento de vídeo do documento offscreen não encontrado.')
  return element
}
