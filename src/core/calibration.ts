import { mean, standardDeviation } from './statistics'
import type { HeadPoseSample, NeutralPose } from './types'

export const CALIBRATION_CONFIG = {
  minimumDurationMs: 2_000,
  maximumDurationMs: 5_000,
  minimumSamples: 20,
  minimumConfidence: 0.5,
  maximumPitchDeviation: 1.5,
  maximumYawRollDeviation: 2.5,
} as const

export type CalibrationStatus = 'IDLE' | 'COLLECTING' | 'CALIBRATED' | 'FAILED'

export interface CalibrationSnapshot {
  status: CalibrationStatus
  baseline: NeutralPose | null
  acceptedSamples: number
  elapsedMs: number
  message: string
}

export class NeutralCalibrator {
  private startedAt: number | null = null
  private samples: HeadPoseSample[] = []
  private baseline: NeutralPose | null = null
  private status: CalibrationStatus = 'IDLE'
  private message = 'Inicie a calibração em uma postura confortável.'

  start(timestamp: number): CalibrationSnapshot {
    this.startedAt = timestamp
    this.samples = []
    this.baseline = null
    this.status = 'COLLECTING'
    this.message = 'Mantenha a cabeça confortável e relativamente estável.'
    return this.snapshot(timestamp)
  }

  reset(): CalibrationSnapshot {
    this.startedAt = null
    this.samples = []
    this.baseline = null
    this.status = 'IDLE'
    this.message = 'Inicie a calibração em uma postura confortável.'
    return this.snapshot(0)
  }

  add(sample: HeadPoseSample): CalibrationSnapshot {
    if (this.status !== 'COLLECTING' || this.startedAt === null) {
      return this.snapshot(sample.timestamp)
    }

    const elapsedMs = sample.timestamp - this.startedAt
    if (sample.confidence >= CALIBRATION_CONFIG.minimumConfidence) {
      this.samples.push(sample)
    }

    const recentStart = sample.timestamp - CALIBRATION_CONFIG.minimumDurationMs
    const recentSamples = this.samples.filter((item) => item.timestamp >= recentStart)

    if (
      elapsedMs >= CALIBRATION_CONFIG.minimumDurationMs &&
      recentSamples.length >= CALIBRATION_CONFIG.minimumSamples
    ) {
      const pitchDeviation = standardDeviation(recentSamples.map((item) => item.pitch))
      const yawDeviation = standardDeviation(recentSamples.map((item) => item.yaw))
      const rollDeviation = standardDeviation(recentSamples.map((item) => item.roll))

      if (
        pitchDeviation <= CALIBRATION_CONFIG.maximumPitchDeviation &&
        yawDeviation <= CALIBRATION_CONFIG.maximumYawRollDeviation &&
        rollDeviation <= CALIBRATION_CONFIG.maximumYawRollDeviation
      ) {
        this.baseline = {
          pitch: mean(recentSamples.map((item) => item.pitch)),
          yaw: mean(recentSamples.map((item) => item.yaw)),
          roll: mean(recentSamples.map((item) => item.roll)),
        }
        this.status = 'CALIBRATED'
        this.message = 'Posição neutra calibrada.'
      } else {
        this.message = 'Movimento detectado. Buscando uma nova janela estável.'
      }
    }

    if (elapsedMs >= CALIBRATION_CONFIG.maximumDurationMs && this.status === 'COLLECTING') {
      this.status = 'FAILED'
      this.message = 'Não foi possível obter uma janela estável. Tente novamente.'
    }

    return this.snapshot(sample.timestamp)
  }

  getBaseline(): NeutralPose | null {
    return this.baseline
  }

  snapshot(timestamp: number): CalibrationSnapshot {
    return {
      status: this.status,
      baseline: this.baseline,
      acceptedSamples: this.samples.length,
      elapsedMs: this.startedAt === null ? 0 : Math.max(0, timestamp - this.startedAt),
      message: this.message,
    }
  }
}
