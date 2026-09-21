<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { browser } from 'wxt/browser'
import type {
  CommandResponse,
  PopupCommand,
  SessionSnapshot,
  StateChangedEvent,
} from '../../extension/messages'
import {
  DEFAULT_SETTINGS,
  SETTINGS_LIMITS,
  type ExtensionSettings,
} from '../../extension/settings'
import {
  EMERGENCY_STOP_COMMAND,
  EMERGENCY_STOP_DEFAULT_SHORTCUT,
} from '../../extension/emergencyStop'

type CameraPermission = PermissionState | 'checking' | 'unsupported'

const state = ref<SessionSnapshot>({
  phase: 'IDLE',
  tabId: null,
  tabTitle: null,
  message: 'Carregando estado…',
  facePresent: false,
  calibrationProgress: 0,
  intent: 'NEUTRAL',
  metrics: null,
  settings: { ...DEFAULT_SETTINGS },
})
const permission = ref<CameraPermission>('checking')
const busy = ref(false)
const errorMessage = ref('')
const emergencyShortcut = ref(EMERGENCY_STOP_DEFAULT_SHORTCUT)
let permissionStatus: PermissionStatus | null = null
let stateRefreshTimer: number | null = null

const isRunning = computed(() => ['STARTING', 'CALIBRATING', 'ACTIVE', 'PAUSED'].includes(state.value.phase))
const needsPermission = computed(() => permission.value !== 'granted')
const phaseLabel = computed(() => ({
  IDLE: 'Desligado',
  STARTING: 'Preparando',
  CALIBRATING: 'Calibrando',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  ERROR: 'Interrompido',
})[state.value.phase])
const intentLabel = computed(() => ({
  UP: 'Subindo',
  DOWN: 'Descendo',
  NEUTRAL: 'Neutro',
})[state.value.intent])
const cameraLabel = computed(() => {
  const metrics = state.value.metrics
  if (!metrics?.cameraWidth || !metrics.cameraHeight) return 'não informada'
  const fps = metrics.cameraFrameRate ? ` · ${metrics.cameraFrameRate.toFixed(0)} fps capturados` : ''
  return `${metrics.cameraWidth}×${metrics.cameraHeight}${fps}`
})
const liveStatusLabel = computed(() => {
  if (state.value.phase === 'PAUSED') return 'Câmera ligada · scroll pausado'
  if (state.value.phase === 'ACTIVE') return 'Câmera ligada · sessão ativa'
  return 'Sessão em preparação'
})

onMounted(async () => {
  browser.runtime.onMessage.addListener(handleRuntimeMessage)
  window.addEventListener('focus', checkPermission)
  await Promise.all([refreshState(), checkPermission(), loadEmergencyShortcut()])
  stateRefreshTimer = window.setInterval(() => { void refreshState() }, 1_000)
})

onBeforeUnmount(() => {
  browser.runtime.onMessage.removeListener(handleRuntimeMessage)
  window.removeEventListener('focus', checkPermission)
  if (permissionStatus) permissionStatus.onchange = null
  if (stateRefreshTimer !== null) window.clearInterval(stateRefreshTimer)
})

async function refreshState(): Promise<void> {
  const result = await send({ target: 'background', type: 'GET_STATE' })
  if (result.state) state.value = result.state
}

async function checkPermission(): Promise<void> {
  if (!navigator.permissions) {
    permission.value = 'unsupported'
    return
  }

  try {
    permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
    permission.value = permissionStatus.state
    permissionStatus.onchange = () => {
      if (permissionStatus) permission.value = permissionStatus.state
    }
  } catch {
    permission.value = 'unsupported'
  }
}

async function loadEmergencyShortcut(): Promise<void> {
  try {
    const commands = await browser.commands.getAll()
    const stopCommand = commands.find((command) => command.name === EMERGENCY_STOP_COMMAND)
    if (stopCommand?.shortcut) emergencyShortcut.value = stopCommand.shortcut
  } catch {
    // O texto padrão continua útil quando o navegador não expõe a lista de atalhos.
  }
}

async function startSession(): Promise<void> {
  if (needsPermission.value) {
    await openOnboarding()
    return
  }
  await runCommand({ target: 'background', type: 'START_SESSION' })
}

async function stopSession(): Promise<void> {
  await runCommand({ target: 'background', type: 'STOP_SESSION' })
}

async function recalibrate(): Promise<void> {
  await runCommand({ target: 'background', type: 'RECALIBRATE' })
}

async function resumeSession(): Promise<void> {
  await runCommand({ target: 'background', type: 'RESUME_SESSION' })
}

async function saveSettings(): Promise<void> {
  const settings: ExtensionSettings = {
    sensitivity: state.value.settings.sensitivity,
    maximumSpeed: state.value.settings.maximumSpeed,
  }
  await runCommand({ target: 'background', type: 'UPDATE_SETTINGS', settings })
}

async function openOnboarding(): Promise<void> {
  await runCommand({ target: 'background', type: 'OPEN_ONBOARDING' })
  window.close()
}

async function runCommand(command: PopupCommand): Promise<void> {
  busy.value = true
  errorMessage.value = ''
  try {
    const result = await send(command)
    if (result.state) state.value = result.state
    if (!result.ok && result.error !== result.state?.message) {
      errorMessage.value = result.error ?? 'Não foi possível concluir a ação.'
    }
  } catch (reason) {
    errorMessage.value = reason instanceof Error ? reason.message : String(reason)
  } finally {
    busy.value = false
  }
}

async function send(command: PopupCommand): Promise<CommandResponse> {
  return await browser.runtime.sendMessage(command) as CommandResponse
}

function handleRuntimeMessage(message: unknown): void {
  if (!isStateChangedEvent(message)) return
  state.value = message.state
}

function isStateChangedEvent(message: unknown): message is StateChangedEvent {
  return Boolean(
    message
      && typeof message === 'object'
      && 'target' in message
      && message.target === 'popup'
      && 'type' in message
      && message.type === 'STATE_CHANGED',
  )
}
</script>

<template>
  <main class="popup-shell">
    <header class="brand-row">
      <div>
        <p class="eyebrow">Cifras Scroll</p>
        <h1>Controle sem as mãos</h1>
      </div>
      <span class="status-dot" :class="`phase-${state.phase.toLowerCase()}`" aria-hidden="true"></span>
    </header>

    <section class="status-card" aria-live="polite">
      <div class="status-heading">
        <span>{{ phaseLabel }}</span>
        <strong v-if="state.phase === 'ACTIVE'">{{ intentLabel }}</strong>
      </div>
      <p>{{ state.message }}</p>
      <p v-if="state.tabTitle" class="tab-name" :title="state.tabTitle">{{ state.tabTitle }}</p>
      <div v-if="state.phase === 'CALIBRATING'" class="progress" aria-label="Progresso da calibração">
        <span :style="{ width: `${state.calibrationProgress * 100}%` }"></span>
      </div>
    </section>

    <div v-if="isRunning" class="live-banner" role="status">
      <span class="live-pulse" aria-hidden="true"></span>
      <strong>{{ liveStatusLabel }}</strong>
      <span>O selo no ícone também indica a sessão.</span>
    </div>

    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

    <div class="action-row">
      <button v-if="!isRunning" class="button primary" :disabled="busy" @click="startSession">
        {{ needsPermission ? 'Autorizar câmera' : 'Ativar nesta aba' }}
      </button>
      <template v-else>
        <button v-if="state.phase === 'PAUSED'" class="button primary" :disabled="busy" @click="resumeSession">
          Retomar
        </button>
        <button class="button secondary" :disabled="busy || state.phase === 'STARTING'" @click="recalibrate">
          Recalibrar
        </button>
      </template>
    </div>

    <button
      v-if="isRunning"
      class="button danger emergency-stop"
      :disabled="busy"
      :aria-keyshortcuts="emergencyShortcut"
      @click="stopSession"
    >
      <span>Parar agora</span>
      <kbd>{{ emergencyShortcut }}</kbd>
    </button>

    <button v-if="state.phase === 'ERROR'" class="help-button" @click="openOnboarding">
      Abrir ajuda de câmera e primeiros passos
    </button>

    <section class="settings" aria-labelledby="settings-title">
      <h2 id="settings-title">Ajustes</h2>
      <label>
        <span><strong>Sensibilidade</strong><output>{{ state.settings.sensitivity }}%</output></span>
        <input
          v-model.number="state.settings.sensitivity"
          type="range"
          :min="SETTINGS_LIMITS.sensitivity.minimum"
          :max="SETTINGS_LIMITS.sensitivity.maximum"
          :step="SETTINGS_LIMITS.sensitivity.step"
          @change="saveSettings"
        >
      </label>
      <label>
        <span><strong>Velocidade</strong><output>{{ state.settings.maximumSpeed }} px/s</output></span>
        <input
          v-model.number="state.settings.maximumSpeed"
          type="range"
          :min="SETTINGS_LIMITS.maximumSpeed.minimum"
          :max="SETTINGS_LIMITS.maximumSpeed.maximum"
          :step="SETTINGS_LIMITS.maximumSpeed.step"
          @change="saveSettings"
        >
      </label>
    </section>

    <section v-if="state.metrics" class="diagnostics" aria-labelledby="diagnostics-title">
      <div class="diagnostics-heading">
        <h2 id="diagnostics-title">Desempenho local</h2>
        <span>janela de 5 s</span>
      </div>
      <dl>
        <div><dt>Inferência</dt><dd>{{ state.metrics.fps.toFixed(1) }} fps</dd></div>
        <div><dt>Latência p50 / p95</dt><dd>{{ state.metrics.latencyP50Ms.toFixed(1) }} / {{ state.metrics.latencyP95Ms.toFixed(1) }} ms</dd></div>
        <div><dt>Carga da inferência</dt><dd>{{ state.metrics.processingLoadPercent.toFixed(0) }}%</dd></div>
        <div><dt>Memória JS</dt><dd>{{ state.metrics.memoryMb === null ? 'indisponível' : `${state.metrics.memoryMb.toFixed(1)} MB` }}</dd></div>
        <div class="wide"><dt>Câmera</dt><dd>{{ cameraLabel }}</dd></div>
      </dl>
    </section>

    <footer>
      <span>Vídeo local · sem áudio · sem gravação</span>
      <button class="link-button" @click="openOnboarding">Ajuda</button>
    </footer>
  </main>
</template>
