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
      return 'O Chrome bloqueou a câmera. Abra a ajuda de câmera, libere o acesso e tente novamente.'
    case 'CAMERA_MISSING':
      return 'Nenhuma câmera foi encontrada. Conecte ou habilite uma câmera e tente novamente.'
    case 'CAMERA_BUSY':
      return 'Outro aplicativo pode estar usando a câmera. Feche esse aplicativo e tente novamente.'
    case 'CONSTRAINT_UNAVAILABLE':
      return 'Esta câmera não ofereceu um modo de vídeo compatível. Reconecte-a ou escolha outra câmera no Chrome.'
    case 'CAMERA_DISCONNECTED':
      return 'A câmera foi desconectada. A sessão foi encerrada e o scroll parou; reconecte-a antes de tentar novamente.'
    default:
      return 'A câmera parou inesperadamente. Verifique a conexão, feche outros aplicativos que usam câmera e tente novamente.'
  }
}

export function pageFailureMessage(url: string | undefined, reason?: unknown): string {
  if (!isSupportedPageUrl(url)) {
    return 'O Chrome não permite controle nesta página. Abra uma página comum com endereço iniciado por http ou https.'
  }

  return reason
    ? 'Não foi possível preparar o controle nesta página. Recarregue a página e tente novamente; se continuar, use outra página comum.'
    : 'Não foi possível preparar o controle nesta página. Recarregue a página e tente novamente.'
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
