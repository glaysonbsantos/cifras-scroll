import type { HeadPoseSample } from './types'

const RADIANS_TO_DEGREES = 180 / Math.PI

export interface TransformationMatrix {
  data: number[] | Float32Array
  rows?: number
  columns?: number
}

/**
 * Extrai ângulos Euler XYZ da matriz column-major retornada pelo MediaPipe.
 * Os sinais são expostos para validação experimental; o baseline torna o
 * interpretador independente de uma orientação absoluta da câmera.
 */
export function poseFromTransformationMatrix(
  matrix: TransformationMatrix,
  confidence: number,
  timestamp: number,
): HeadPoseSample | null {
  if (matrix.data.length < 16) return null

  const data = matrix.data
  const r00 = data[0] ?? 0
  const r10 = data[1] ?? 0
  const r20 = data[2] ?? 0
  const r21 = data[6] ?? 0
  const r22 = data[10] ?? 0

  const normalizeZero = (value: number) => Object.is(value, -0) ? 0 : value
  const pitch = normalizeZero(Math.atan2(r21, r22) * RADIANS_TO_DEGREES)
  const yaw = normalizeZero(
    Math.asin(Math.max(-1, Math.min(1, -r20))) * RADIANS_TO_DEGREES,
  )
  const roll = normalizeZero(Math.atan2(r10, r00) * RADIANS_TO_DEGREES)

  if (![pitch, yaw, roll].every(Number.isFinite)) return null

  return {
    pitch,
    yaw,
    roll,
    confidence: Math.max(0, Math.min(1, confidence)),
    timestamp,
  }
}
