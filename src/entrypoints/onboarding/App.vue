<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { browser } from 'wxt/browser'
import { cameraFailureMessage } from '../../extension/sessionSafety'
import {
  EMERGENCY_STOP_COMMAND,
  EMERGENCY_STOP_DEFAULT_SHORTCUT,
} from '../../extension/emergencyStop'

type OnboardingStatus = 'IDLE' | 'REQUESTING' | 'GRANTED' | 'ERROR'

const status = ref<OnboardingStatus>('IDLE')
const message = ref('A câmera continua desligada até você autorizar explicitamente.')
const emergencyShortcut = ref(EMERGENCY_STOP_DEFAULT_SHORTCUT)
let permissionStatus: PermissionStatus | null = null

onMounted(async () => {
  void loadEmergencyShortcut()
  try {
    permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
    updatePermissionState(permissionStatus.state)
    permissionStatus.onchange = () => {
      if (permissionStatus) updatePermissionState(permissionStatus.state)
    }
    if (permissionStatus.state === 'granted') {
      status.value = 'GRANTED'
      message.value = 'A permissão de câmera já está concedida. Você pode ativar a extensão.'
    }
  } catch {
    // O clique abaixo continua sendo a fonte de verdade em versões sem Permissions API.
  }
})

onBeforeUnmount(() => {
  if (permissionStatus) permissionStatus.onchange = null
})

async function requestCamera(): Promise<void> {
  status.value = 'REQUESTING'
  message.value = 'Solicitando acesso somente ao vídeo…'

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    stream.getTracks().forEach((track) => track.stop())
    status.value = 'GRANTED'
    const released = stream.getTracks().every((track) => track.readyState === 'ended')
    message.value = released
      ? 'Permissão concedida. A câmera de verificação já foi liberada.'
      : 'Permissão concedida. Feche esta página se o indicador da câmera continuar aceso.'
  } catch (reason) {
    status.value = 'ERROR'
    message.value = cameraFailureMessage(reason)
  }
}

async function loadEmergencyShortcut(): Promise<void> {
  try {
    const commands = await browser.commands.getAll()
    const stopCommand = commands.find((command) => command.name === EMERGENCY_STOP_COMMAND)
    if (stopCommand?.shortcut) emergencyShortcut.value = stopCommand.shortcut
  } catch {
    // Mantém o atalho sugerido no manifest como orientação de fallback.
  }
}

async function openCameraSettings(): Promise<void> {
  await browser.tabs.create({ url: 'chrome://settings/content/camera' })
}

async function openShortcutSettings(): Promise<void> {
  await browser.tabs.create({ url: 'chrome://extensions/shortcuts' })
}

function updatePermissionState(state: PermissionState): void {
  if (state === 'granted') {
    status.value = 'GRANTED'
    message.value = 'A permissão de câmera está concedida. Você pode ativar a extensão.'
  } else if (state === 'denied') {
    status.value = 'ERROR'
    message.value = 'A câmera está bloqueada. Libere a permissão nas configurações do Chrome e recarregue esta página.'
  } else {
    status.value = 'IDLE'
    message.value = 'A câmera continua desligada até você autorizar explicitamente.'
  }
}

function closePage(): void {
  window.close()
}
</script>

<template>
  <main class="page-shell">
    <section class="hero-card">
      <div class="mark" aria-hidden="true">↕</div>
      <p class="eyebrow">Configuração inicial</p>
      <h1>Role páginas com movimentos da cabeça</h1>
      <p class="lead">
        Em cerca de um minuto, você autoriza a câmera e ativa o controle na página que quer ler.
        Todo o processamento acontece neste dispositivo.
      </p>

      <ol class="steps" aria-label="Primeiros passos">
        <li><span>1</span><div><strong>Autorize somente a câmera</strong><p>A verificação abaixo liga o vídeo por um instante e o libera imediatamente.</p></div></li>
        <li><span>2</span><div><strong>Abra uma página comum</strong><p>Use uma página cujo endereço comece com http ou https e abra o popup da extensão.</p></div></li>
        <li><span>3</span><div><strong>Ative e fique em posição confortável</strong><p>A calibração define seu neutro. Depois, incline a cabeça para rolar.</p></div></li>
        <li><span>4</span><div><strong>Pare a qualquer momento</strong><p>Use <b>Parar agora</b> no popup ou <kbd>{{ emergencyShortcut }}</kbd>, mesmo com o popup fechado.</p></div></li>
      </ol>

      <div class="permission-card" :class="`status-${status.toLowerCase()}`" role="status">
        <span class="permission-icon" aria-hidden="true">●</span>
        <div>
          <strong>{{ status === 'GRANTED' ? 'Câmera autorizada' : status === 'ERROR' ? 'Atenção necessária' : 'Permissão de câmera' }}</strong>
          <p>{{ message }}</p>
        </div>
      </div>

      <div class="actions">
        <button v-if="status !== 'GRANTED'" :disabled="status === 'REQUESTING'" @click="requestCamera">
          {{ status === 'REQUESTING' ? 'Solicitando…' : 'Autorizar câmera' }}
        </button>
        <button v-else @click="closePage">Concluir</button>
        <span>Depois, abra o popup da extensão em uma página comum.</span>
      </div>

      <div v-if="status === 'ERROR'" class="recovery-actions">
        <button class="text-button" @click="openCameraSettings">Abrir configurações da câmera</button>
        <span>Confirme que o Chrome e o Cifras Scroll podem usar a câmera.</span>
      </div>

      <details>
        <summary>Privacidade, indicador e ajuda</summary>
        <ul class="privacy-list">
          <li>Nenhum áudio é solicitado.</li>
          <li>Vídeo e frames não são gravados nem enviados.</li>
          <li>O selo <strong>ON</strong> no ícone indica câmera e sessão em uso; <strong>PAUS</strong> indica scroll pausado com câmera ainda ligada.</li>
          <li>Ao parar, o selo desaparece e a câmera é liberada.</li>
        </ul>
        <button class="text-button shortcut-settings" @click="openShortcutSettings">Ver ou alterar o atalho de emergência</button>
      </details>
    </section>
  </main>
</template>
