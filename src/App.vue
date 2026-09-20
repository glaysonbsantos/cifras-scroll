<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  NeutralCalibrator,
  type CalibrationSnapshot,
} from './core/calibration'
import { GestureInterpreter } from './core/gestureInterpreter'
import { MetricsTracker } from './core/metrics'
import type {
  HeadPoseSample,
  InferenceMetrics,
  ScrollIntent,
} from './core/types'
import {
  CameraPipeline,
  type CameraDetails,
} from './vision/cameraPipeline'
import type { DetectionFrame } from './vision/facePoseDetector'
import { TimeBasedScroller } from './web/timeBasedScroller'

type SessionStatus = 'IDLE' | 'STARTING' | 'RUNNING' | 'ERROR'

const video = ref<HTMLVideoElement | null>(null)
const status = ref<SessionStatus>('IDLE')
const statusMessage = ref('A câmera permanece desligada até você iniciar a sessão.')
const sample = ref<HeadPoseSample | null>(null)
const facePresent = ref(false)
const controlEnabled = ref(false)
const sensitivity = ref(100)
const maximumSpeed = ref(720)
const cameraDetails = ref<CameraDetails>({ width: null, height: null, frameRate: null })
const intent = ref<ScrollIntent>({
  action: 'NEUTRAL',
  intensity: 0,
  relativePitch: 0,
  filteredPitch: null,
  pendingAction: null,
  dwellProgress: 0,
})
const calibration = ref<CalibrationSnapshot>({
  status: 'IDLE',
  baseline: null,
  acceptedSamples: 0,
  elapsedMs: 0,
  message: 'Inicie a calibração em uma postura confortável.',
})
const metrics = reactive<InferenceMetrics>({
  fps: 0,
  latencyMs: 0,
  latencyP50Ms: 0,
  latencyP95Ms: 0,
  stateChanges: 0,
  faceLosses: 0,
  faceRecoveries: 0,
})

const calibrator = new NeutralCalibrator()
const interpreter = new GestureInterpreter()
const metricsTracker = new MetricsTracker()
const scroller = new TimeBasedScroller()

const pipeline = new CameraPipeline({
  onFrame: handleFrame,
  onCameraReady: (details) => {
    cameraDetails.value = details
  },
  onError: handlePipelineError,
})

const isRunning = computed(() => status.value === 'RUNNING')
const isCalibrating = computed(() => calibration.value.status === 'COLLECTING')
const canEnableControl = computed(() => isRunning.value && calibration.value.status === 'CALIBRATED')
const calibrationProgress = computed(() =>
  Math.min(100, (calibration.value.elapsedMs / 5_000) * 100),
)
const thresholds = computed(() => {
  sensitivity.value
  return interpreter.getThresholds()
})
const intentLabel = computed(() => ({
  UP: 'Para cima',
  DOWN: 'Para baixo',
  NEUTRAL: 'Neutro',
})[intent.value.action])
const sessionLabel = computed(() => ({
  IDLE: 'Desligada',
  STARTING: 'Preparando',
  RUNNING: 'Ativa',
  ERROR: 'Interrompida',
})[status.value])

async function startSession(): Promise<void> {
  if (!video.value || status.value === 'STARTING' || status.value === 'RUNNING') return

  status.value = 'STARTING'
  statusMessage.value = 'Carregando o detector local e solicitando acesso somente ao vídeo...'

  try {
    await pipeline.start(video.value)
    interpreter.reset()
    status.value = 'RUNNING'
    statusMessage.value = 'Sessão ativa. Calibre a posição neutra para interpretar movimentos.'
  } catch {
    // O callback do pipeline apresenta o erro e garante a liberação da câmera.
  }
}

function stopSession(): void {
  disableControl()
  pipeline.stop(video.value ?? undefined)
  status.value = 'IDLE'
  statusMessage.value = 'Sessão encerrada e câmera liberada.'
  sample.value = null
  facePresent.value = false
  intent.value = interpreter.reset()
  calibration.value = calibrator.reset()
}

function startCalibration(): void {
  if (!isRunning.value) return
  disableControl()
  calibration.value = calibrator.start(performance.now())
  intent.value = interpreter.reset()
  statusMessage.value = 'Recalibrando. Mantenha uma postura confortável e estável.'
}

function enableControl(): void {
  if (!canEnableControl.value) return
  intent.value = interpreter.reset()
  scroller.stop()
  controlEnabled.value = true
  statusMessage.value = 'Scroll por movimento ativo. Pressione Esc ou use o botão fixo para pausar.'
}

function disableControl(message?: string): void {
  controlEnabled.value = false
  scroller.stop()
  if (message) statusMessage.value = message
}

function updateSensitivity(): void {
  interpreter.setSensitivity(sensitivity.value)
  intent.value = interpreter.reset()
  scroller.stop()
}

function updateMaximumSpeed(): void {
  scroller.setMaximumSpeed(maximumSpeed.value)
}

function applyScrollIntent(nextIntent: ScrollIntent): void {
  try {
    scroller.setIntent(nextIntent)
  } catch (reason) {
    const detail = reason instanceof Error ? ` (${reason.message})` : ''
    disableControl(`Falha ao iniciar o scroll${detail}. A câmera continua ativa.`)
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && controlEnabled.value) {
    disableControl('Scroll pausado pela tecla Esc. A câmera continua ativa.')
  }
}

function handleFrame(frame: DetectionFrame): void {
  sample.value = frame.sample
  facePresent.value = frame.facePresent

  if (isCalibrating.value) {
    const previousCalibrationStatus = calibration.value.status
    calibration.value = calibrator.add(
      frame.sample ?? {
        pitch: 0,
        yaw: 0,
        roll: 0,
        confidence: 0,
        timestamp: frame.timestamp,
      },
    )
    if (
      previousCalibrationStatus === 'COLLECTING' &&
      calibration.value.status === 'CALIBRATED'
    ) {
      intent.value = interpreter.reset()
      statusMessage.value = 'Calibração concluída. Ative o scroll quando estiver pronto.'
    }
  }

  intent.value = interpreter.update(frame.sample, calibrator.getBaseline())

  if (controlEnabled.value && (!frame.sample || frame.sample.confidence < 0.5)) {
    disableControl('Face perdida: scroll pausado imediatamente. Reative quando estiver enquadrado.')
  } else if (controlEnabled.value) {
    applyScrollIntent(intent.value)
  }

  metricsTracker.record(
    frame.timestamp,
    frame.latencyMs,
    intent.value.action,
    frame.facePresent,
  )
  Object.assign(metrics, metricsTracker.snapshot())
}

function handlePipelineError(error: Error): void {
  disableControl()
  status.value = 'ERROR'
  intent.value = interpreter.reset()

  if (error.name === 'NotAllowedError') {
    statusMessage.value = 'Acesso à câmera negado. Autorize o vídeo no navegador e tente novamente.'
  } else if (error.name === 'NotFoundError') {
    statusMessage.value = 'Nenhuma câmera de vídeo foi encontrada.'
  } else if (error.name === 'NotReadableError') {
    statusMessage.value = 'A câmera está indisponível ou sendo usada por outro aplicativo.'
  } else {
    statusMessage.value = `A sessão foi interrompida: ${error.message}`
  }
}

function number(value: number | null | undefined, digits = 1): string {
  return value == null ? '—' : value.toFixed(digits)
}

onMounted(() => {
  scroller.setMaximumSpeed(maximumSpeed.value)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  scroller.stop()
  pipeline.dispose(video.value ?? undefined)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main class="shell">
    <header class="hero">
      <div>
        <p class="eyebrow">POC local · Fase 2</p>
        <h1>Cifras Scroll</h1>
        <p class="hero-copy">
          Controle de scroll estabilizado por pose da cabeça, com ativação explícita e parada segura.
        </p>
      </div>
      <div class="privacy-note">
        <span class="privacy-dot" aria-hidden="true"></span>
        Vídeo processado apenas neste dispositivo. Sem áudio, gravação ou envio de frames.
      </div>
    </header>

    <section class="workspace" aria-label="Controles e diagnóstico">
      <article class="camera-card panel">
        <div class="panel-heading">
          <div>
            <p class="section-label">Câmera</p>
            <h2>{{ sessionLabel }}</h2>
          </div>
          <span class="status-pill" :class="`status-${status.toLowerCase()}`">{{ sessionLabel }}</span>
        </div>

        <div class="video-frame">
          <video ref="video" muted playsinline aria-label="Pré-visualização local da câmera"></video>
          <div v-if="!isRunning" class="video-placeholder">
            <span class="camera-icon" aria-hidden="true">◉</span>
            <span>Câmera desligada</span>
          </div>
          <div v-else class="face-indicator" :class="{ found: facePresent }">
            {{ facePresent ? 'Face detectada' : 'Procurando face' }}
          </div>
        </div>

        <p class="status-message" role="status">{{ statusMessage }}</p>
        <div class="button-row">
          <button v-if="!isRunning" class="button primary" :disabled="status === 'STARTING'" @click="startSession">
            {{ status === 'STARTING' ? 'Preparando…' : 'Iniciar câmera' }}
          </button>
          <button v-else class="button danger" @click="stopSession">Parar e liberar câmera</button>
          <button class="button secondary" :disabled="!isRunning || isCalibrating" @click="startCalibration">
            {{ calibration.status === 'CALIBRATED' ? 'Recalibrar' : 'Calibrar neutro' }}
          </button>
        </div>
      </article>

      <article class="intent-card panel" :class="`intent-${intent.action.toLowerCase()}`">
        <p class="section-label">Intenção interpretada</p>
        <div class="intent-display">
          <span class="intent-arrow" aria-hidden="true">
            {{ intent.action === 'UP' ? '↑' : intent.action === 'DOWN' ? '↓' : '•' }}
          </span>
          <div>
            <h2>{{ intentLabel }}</h2>
            <p v-if="intent.pendingAction">
              Confirmando gesto para {{ intent.pendingAction === 'UP' ? 'cima' : 'baixo' }}…
            </p>
            <p v-else-if="controlEnabled">A intenção está controlando o scroll desta página.</p>
            <p v-else>A intenção é exibida, mas o scroll está pausado.</p>
          </div>
        </div>
        <div class="intensity-track" aria-label="Intensidade da intenção">
          <span :style="{ width: `${intent.intensity * 100}%` }"></span>
        </div>
        <dl class="compact-stats">
          <div><dt>Pitch filtrado</dt><dd>{{ number(intent.filteredPitch) }}°</dd></div>
          <div><dt>Pitch relativo</dt><dd>{{ number(intent.relativePitch) }}°</dd></div>
          <div><dt>Intensidade</dt><dd>{{ number(intent.intensity * 100, 0) }}%</dd></div>
          <div><dt>Dwell</dt><dd>{{ number(intent.dwellProgress * 100, 0) }}%</dd></div>
        </dl>
      </article>

      <article class="calibration-card panel">
        <p class="section-label">Calibração</p>
        <h2>{{ calibration.status === 'CALIBRATED' ? 'Neutro definido' : 'Aguardando neutro' }}</h2>
        <p>{{ calibration.message }}</p>
        <div class="progress-track" aria-hidden="true">
          <span :style="{ width: `${calibrationProgress}%` }"></span>
        </div>
        <dl class="compact-stats">
          <div><dt>Amostras aceitas</dt><dd>{{ calibration.acceptedSamples }}</dd></div>
          <div><dt>Tempo</dt><dd>{{ number(calibration.elapsedMs / 1000) }} s</dd></div>
          <div><dt>Baseline pitch</dt><dd>{{ number(calibration.baseline?.pitch) }}°</dd></div>
        </dl>
      </article>

      <article class="control-card panel">
        <div class="panel-heading">
          <div>
            <p class="section-label">Controle da página</p>
            <h2>{{ controlEnabled ? 'Scroll ativo' : 'Scroll pausado' }}</h2>
          </div>
          <span class="status-pill" :class="controlEnabled ? 'status-running' : ''">
            {{ controlEnabled ? 'Ativo' : 'Pausado' }}
          </span>
        </div>
        <p class="control-help">
          Calibre primeiro e ative quando estiver pronto. Perda de face, recalibração, Esc ou pausa interrompem o movimento.
        </p>
        <div class="button-row control-actions">
          <button v-if="!controlEnabled" class="button primary" :disabled="!canEnableControl" @click="enableControl">
            Ativar scroll
          </button>
          <button v-else class="button danger" @click="disableControl('Scroll pausado. A câmera continua ativa.')">
            Pausar scroll
          </button>
        </div>
        <label class="range-control">
          <span><strong>Sensibilidade</strong><output>{{ sensitivity }}%</output></span>
          <input
            v-model.number="sensitivity"
            type="range"
            min="70"
            max="140"
            step="5"
            @input="updateSensitivity"
          >
        </label>
        <label class="range-control">
          <span><strong>Velocidade máxima</strong><output>{{ maximumSpeed }} px/s</output></span>
          <input
            v-model.number="maximumSpeed"
            type="range"
            min="240"
            max="1200"
            step="40"
            @input="updateMaximumSpeed"
          >
        </label>
      </article>
    </section>

    <section class="diagnostics" aria-labelledby="diagnostics-title">
      <div class="section-heading">
        <div>
          <p class="section-label">Instrumentação em memória</p>
          <h2 id="diagnostics-title">Sinal e desempenho</h2>
        </div>
        <span>Janela móvel de 5 segundos</span>
      </div>

      <div class="metric-grid">
        <article class="metric"><span>Pitch bruto</span><strong>{{ number(sample?.pitch) }}°</strong></article>
        <article class="metric"><span>Pitch filtrado</span><strong>{{ number(intent.filteredPitch) }}°</strong></article>
        <article class="metric"><span>Yaw</span><strong>{{ number(sample?.yaw) }}°</strong></article>
        <article class="metric"><span>Roll</span><strong>{{ number(sample?.roll) }}°</strong></article>
        <article class="metric"><span>Presença (proxy)</span><strong>{{ facePresent ? '100%' : '0%' }}</strong></article>
        <article class="metric"><span>Inferências/s</span><strong>{{ number(metrics.fps) }}</strong></article>
        <article class="metric"><span>Latência atual</span><strong>{{ number(metrics.latencyMs) }} ms</strong></article>
        <article class="metric"><span>Latência p50</span><strong>{{ number(metrics.latencyP50Ms) }} ms</strong></article>
        <article class="metric"><span>Latência p95</span><strong>{{ number(metrics.latencyP95Ms) }} ms</strong></article>
        <article class="metric"><span>Mudanças de estado</span><strong>{{ metrics.stateChanges }}</strong></article>
        <article class="metric"><span>Perdas / recuperações</span><strong>{{ metrics.faceLosses }} / {{ metrics.faceRecoveries }}</strong></article>
        <article class="metric"><span>Entrada / saída</span><strong>{{ number(thresholds.entryDegrees) }}° / {{ number(thresholds.exitDegrees) }}°</strong></article>
        <article class="metric"><span>Resolução</span><strong>{{ cameraDetails.width ?? '—' }} × {{ cameraDetails.height ?? '—' }}</strong></article>
        <article class="metric"><span>FPS da câmera</span><strong>{{ number(cameraDetails.frameRate) }}</strong></article>
      </div>
    </section>

    <section class="reading-area" aria-labelledby="reading-title">
      <div class="section-heading">
        <div>
          <p class="section-label">Área de ensaio</p>
          <h2 id="reading-title">Página longa para teste de scroll</h2>
        </div>
        <span>Ative o controle, incline a cabeça e retorne ao neutro para parar.</span>
      </div>

      <article class="song-sheet">
        <p v-for="verse in 12" :key="verse">
          <span class="chords">C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Am&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;F&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;G</span>
          <span>Linha de referência {{ verse }} para simular uma leitura longa durante o experimento.</span>
          <span class="chords">F&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;G&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C</span>
          <span>Mantenha uma postura confortável, cante, toque e observe se a intenção fica neutra.</span>
        </p>
      </article>
    </section>

    <button v-if="controlEnabled" class="emergency-stop" @click="disableControl('Scroll pausado. A câmera continua ativa.')">
      Pausar scroll <span>Esc</span>
    </button>
  </main>
</template>
