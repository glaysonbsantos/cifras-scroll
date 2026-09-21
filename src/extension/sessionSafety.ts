export type SessionFailureKind =
  | 'PERMISSION_DENIED'
  | 'CAMERA_MISSING'
  | 'CAMERA_BUSY'
  | 'CAMERA_DISCONNECTED'
  | 'CONSTRAINT_UNAVAILABLE'
  | 'UNKNOWN'

export function isSupportedPageUrl(url?: string): boolean {
  if (!url) return false

  try {
    const protocol = new URL(url).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export function classifyCameraFailure(reason: unknown): SessionFailureKind {
  const name = errorFrom(reason).name
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'PERMISSION_DENIED'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'CAMERA_MISSING'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'CAMERA_BUSY'
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') return 'CONSTRAINT_UNAVAILABLE'
  if (name === 'AbortError' || name === 'CameraDisconnectedError') return 'CAMERA_DISCONNECTED'
  return 'UNKNOWN'
}

export function cameraFailureMessage(reason: unknown): string {
  switch (classifyCameraFailure(reason)) {
    case 'PERMISSION_DENIED':
      return 'A permissão da câmera foi negada ou revogada. Libere o acesso nas configurações do Chrome e tente novamente.'
    case 'CAMERA_MISSING':
      return 'Nenhuma câmera de vídeo foi encontrada. Conecte uma câmera e tente novamente.'
    case 'CAMERA_BUSY':
      return 'A câmera está ocupada por outro aplicativo ou indisponível. Feche o outro uso e tente novamente.'
    case 'CONSTRAINT_UNAVAILABLE':
      return 'A câmera não oferece uma configuração de vídeo compatível.'
    case 'CAMERA_DISCONNECTED':
      return 'A câmera foi desconectada ou deixou de fornecer vídeo. A sessão foi encerrada com segurança.'
    default:
      return `A sessão foi interrompida: ${errorFrom(reason).message}`
  }
}

export function pageFailureMessage(url: string | undefined, reason?: unknown): string {
  if (!isSupportedPageUrl(url)) {
    return 'Esta página é protegida pelo navegador. Abra uma página comum com endereço http ou https.'
  }

  const detail = reason ? errorFrom(reason).message : ''
  return detail
    ? `Não foi possível controlar esta página. O Chrome bloqueou a injeção do scroll (${detail}).`
    : 'Não foi possível controlar esta página. O Chrome bloqueou a injeção do scroll.'
}

export function namedError(name: string, message: string): Error {
  const error = new Error(message)
  error.name = name
  return error
}

function errorFrom(reason: unknown): Error {
  if (reason instanceof Error) return reason
  if (reason && typeof reason === 'object') {
    const candidate = reason as { name?: unknown; message?: unknown }
    const error = new Error(typeof candidate.message === 'string' ? candidate.message : String(reason))
    if (typeof candidate.name === 'string') error.name = candidate.name
    return error
  }
  return new Error(String(reason))
}
