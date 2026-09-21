import type { SessionPhase } from './messages'

export interface SessionIndicator {
  badgeText: string
  badgeColor: string
  title: string
}

export function sessionIndicator(
  phase: SessionPhase,
  tabTitle: string | null,
): SessionIndicator {
  const target = tabTitle ? ` em “${tabTitle}”` : ''

  switch (phase) {
    case 'STARTING':
      return {
        badgeText: 'ON',
        badgeColor: '#b56d0b',
        title: `Cifras Scroll — iniciando${target}. Use o atalho de emergência para parar.`,
      }
    case 'CALIBRATING':
      return {
        badgeText: 'ON',
        badgeColor: '#b56d0b',
        title: `Cifras Scroll — calibrando${target}. Use o atalho de emergência para parar.`,
      }
    case 'ACTIVE':
      return {
        badgeText: 'ON',
        badgeColor: '#18794e',
        title: `Cifras Scroll — sessão ativa${target}. Use o atalho de emergência para parar.`,
      }
    case 'PAUSED':
      return {
        badgeText: 'PAUS',
        badgeColor: '#476a9e',
        title: `Cifras Scroll — sessão pausada${target}. A câmera continua ativa; use o atalho de emergência para parar.`,
      }
    case 'ERROR':
      return {
        badgeText: '!',
        badgeColor: '#a23b32',
        title: 'Cifras Scroll — sessão interrompida. Abra para ver como resolver.',
      }
    case 'IDLE':
      return {
        badgeText: '',
        badgeColor: '#68736c',
        title: 'Cifras Scroll — desligado',
      }
  }
}
