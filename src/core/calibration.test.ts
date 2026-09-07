import { describe, expect, it } from 'vitest'
import { NeutralCalibrator } from './calibration'
import type { HeadPoseSample } from './types'

function sample(timestamp: number, pitch = 10, confidence = 1): HeadPoseSample {
  return { pitch, yaw: 2, roll: -1, confidence, timestamp }
}

describe('NeutralCalibrator', () => {
  it('calibra depois de uma janela estavel de dois segundos', () => {
    const calibrator = new NeutralCalibrator()
    calibrator.start(0)

    let result = calibrator.snapshot(0)
    for (let index = 0; index <= 25; index += 1) {
      result = calibrator.add(sample(index * 100, 10 + (index % 2) * 0.1))
    }

    expect(result.status).toBe('CALIBRATED')
    expect(result.baseline?.pitch).toBeCloseTo(10.05, 1)
  })

  it('falha apos cinco segundos sem amostras confiaveis', () => {
    const calibrator = new NeutralCalibrator()
    calibrator.start(0)

    expect(calibrator.add(sample(5_000, 10, 0.2)).status).toBe('FAILED')
  })

  it('nao aceita uma janela com movimento excessivo', () => {
    const calibrator = new NeutralCalibrator()
    calibrator.start(0)

    let result = calibrator.snapshot(0)
    for (let index = 0; index <= 24; index += 1) {
      result = calibrator.add(sample(index * 100, index % 2 === 0 ? 5 : 15))
    }

    expect(result.status).toBe('COLLECTING')
    expect(result.message).toContain('Movimento detectado')
  })
})
