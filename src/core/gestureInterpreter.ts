import type {
  HeadPoseSample,
  NeutralPose,
  ScrollAction,
  ScrollIntent,
} from './types'

export const GESTURE_CONFIG = {
  minimumConfidence: 0.5,
  smoothingTimeConstantMs: 70,
  entryThresholdDegrees: 6,
  exitThresholdDegrees: 3.5,
  maximumIntensityDegrees: 18,
  activationDwellMs: 120,
  minimumSensitivityPercent: 70,
  maximumSensitivityPercent: 140,
} as const

export interface GestureThresholds {
  entryDegrees: number
  exitDegrees: number
  maximumIntensityDegrees: number
}

type Direction = Exclude<ScrollAction, 'NEUTRAL'>

const neutralIntent = (): ScrollIntent => ({
  action: 'NEUTRAL',
  intensity: 0,
  relativePitch: 0,
  filteredPitch: null,
  pendingAction: null,
  dwellProgress: 0,
})

export class GestureInterpreter {
  private action: ScrollAction = 'NEUTRAL'
  private filteredPitch: number | null = null
  private lastTimestamp: number | null = null
  private pendingAction: Direction | null = null
  private pendingSince: number | null = null
  private sensitivityPercent = 100

  update(sample: HeadPoseSample | null, baseline: NeutralPose | null): ScrollIntent {
    if (!sample || !baseline || sample.confidence < GESTURE_CONFIG.minimumConfidence) {
      return this.reset()
    }

    this.filteredPitch = this.filterPitch(sample.pitch, sample.timestamp)
    this.lastTimestamp = sample.timestamp

    const relativePitch = this.filteredPitch - baseline.pitch
    const thresholds = this.getThresholds()

    if (this.action === 'UP' && relativePitch >= -thresholds.exitDegrees) {
      this.action = 'NEUTRAL'
      this.clearPending()
    } else if (this.action === 'DOWN' && relativePitch <= thresholds.exitDegrees) {
      this.action = 'NEUTRAL'
      this.clearPending()
    }

    if (this.action === 'NEUTRAL') {
      const candidate = this.directionBeyondEntry(relativePitch, thresholds.entryDegrees)
      this.updatePending(candidate, sample.timestamp)

      if (
        this.pendingAction &&
        this.pendingSince !== null &&
        sample.timestamp - this.pendingSince >= GESTURE_CONFIG.activationDwellMs
      ) {
        this.action = this.pendingAction
        this.clearPending()
      }
    }

    const intensity = this.action === 'NEUTRAL'
      ? 0
      : this.intensityFor(relativePitch, thresholds)

    return {
      action: this.action,
      intensity,
      relativePitch,
      filteredPitch: this.filteredPitch,
      pendingAction: this.pendingAction,
      dwellProgress: this.pendingSince === null
        ? 0
        : Math.min(1, (sample.timestamp - this.pendingSince) / GESTURE_CONFIG.activationDwellMs),
    }
  }

  reset(): ScrollIntent {
    this.action = 'NEUTRAL'
    this.filteredPitch = null
    this.lastTimestamp = null
    this.clearPending()
    return neutralIntent()
  }

  setSensitivity(percent: number): void {
    this.sensitivityPercent = Math.max(
      GESTURE_CONFIG.minimumSensitivityPercent,
      Math.min(GESTURE_CONFIG.maximumSensitivityPercent, percent),
    )
    this.reset()
  }

  getThresholds(): GestureThresholds {
    const factor = 100 / this.sensitivityPercent
    return {
      entryDegrees: GESTURE_CONFIG.entryThresholdDegrees * factor,
      exitDegrees: GESTURE_CONFIG.exitThresholdDegrees * factor,
      maximumIntensityDegrees: GESTURE_CONFIG.maximumIntensityDegrees * factor,
    }
  }

  private filterPitch(pitch: number, timestamp: number): number {
    if (this.filteredPitch === null || this.lastTimestamp === null) return pitch

    const elapsedMs = Math.max(0, timestamp - this.lastTimestamp)
    const alpha = 1 - Math.exp(-elapsedMs / GESTURE_CONFIG.smoothingTimeConstantMs)
    return this.filteredPitch + alpha * (pitch - this.filteredPitch)
  }

  private directionBeyondEntry(relativePitch: number, entryDegrees: number): Direction | null {
    if (relativePitch >= entryDegrees) return 'DOWN'
    if (relativePitch <= -entryDegrees) return 'UP'
    return null
  }

  private updatePending(candidate: Direction | null, timestamp: number): void {
    if (candidate === null) {
      this.clearPending()
      return
    }

    if (candidate !== this.pendingAction) {
      this.pendingAction = candidate
      this.pendingSince = timestamp
    }
  }

  private clearPending(): void {
    this.pendingAction = null
    this.pendingSince = null
  }

  private intensityFor(relativePitch: number, thresholds: GestureThresholds): number {
    const range = thresholds.maximumIntensityDegrees - thresholds.exitDegrees
    return Math.max(0, Math.min(1, (Math.abs(relativePitch) - thresholds.exitDegrees) / range))
  }
}
