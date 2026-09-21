<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { cameraFailureMessage } from '../../extension/sessionSafety'

type OnboardingStatus = 'IDLE' | 'REQUESTING' | 'GRANTED' | 'ERROR'

const status = ref<OnboardingStatus>('IDLE')
const message = ref('A câmera continua desligada até você autorizar explicitamente.')
let permissionStatus: PermissionStatus | null = null

onMounted(async () => {
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
        O Cifras Scroll usa a câmera para estimar sua pose e controlar somente a aba escolhida.
        Todo o processamento acontece neste dispositivo.
      </p>

      <ul>
        <li>Nenhum áudio é solicitado.</li>
        <li>Vídeo e frames não são gravados nem enviados.</li>
        <li>A câmera é liberada quando você pressiona <strong>Parar</strong>.</li>
      </ul>

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
    </section>
  </main>
</template>
