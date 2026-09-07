import type { HeadPoseSample, NeutralPose, ScrollIntent } from './types'

export const ENTRY_THRESHOLD_DEGREES = 6
export const MAXIMUM_INTENSITY_DEGREES = 18

export function interpretGesture(
  sample: HeadPoseSample | null,
  baseline: NeutralPose | null,
): ScrollIntent {
  if (!sample || !baseline || sample.confidence < 0.5) {
    return { action: 'NEUTRAL', intensity: 0, relativePitch: 0 }
  }

  const relativePitch = sample.pitch - baseline.pitch
  const magnitude = Math.abs(relativePitch)

  if (magnitude < ENTRY_THRESHOLD_DEGREES) {
    return { action: 'NEUTRAL', intensity: 0, relativePitch }
  }

  const intensity = Math.min(
    1,
    (magnitude - ENTRY_THRESHOLD_DEGREES) /
      (MAXIMUM_INTENSITY_DEGREES - ENTRY_THRESHOLD_DEGREES),
  )

  return {
    action: relativePitch > 0 ? 'DOWN' : 'UP',
    intensity,
    relativePitch,
  }
}
