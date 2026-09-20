import { describe, expect, it } from 'vitest'
import { GestureInterpreter } from './gestureInterpreter'
import type { HeadPoseSample, NeutralPose } from './types'

const baseline: NeutralPose = { pitch: 10, yaw: 0, roll: 0 }

function sample(pitch: number, timestamp: number, confidence = 1): HeadPoseSample {
  return { pitch, yaw: 0, roll: 0, confidence, timestamp }
}

describe('GestureInterpreter', () => {
  it('filtra o pitch e permanece neutro dentro do limite de entrada', () => {
    const interpreter = new GestureInterpreter()
    interpreter.update(sample(10, 0), baseline)

    const result = interpreter.update(sample(20, 10), baseline)

    expect(result.filteredPitch).toBeGreaterThan(10)
    expect(result.filteredPitch).toBeLessThan(20)
    expect(result.action).toBe('NEUTRAL')
  })

  it('exige permanencia antes de ativar uma direcao', () => {
    const interpreter = new GestureInterpreter()

    expect(interpreter.update(sample(17, 0), baseline).action).toBe('NEUTRAL')
    expect(interpreter.update(sample(17, 100), baseline).action).toBe('NEUTRAL')
    expect(interpreter.update(sample(17, 120), baseline).action).toBe('DOWN')
  })

  it('cancela um gesto transitorio antes do dwell', () => {
    const interpreter = new GestureInterpreter()

    expect(interpreter.update(sample(17, 0), baseline).pendingAction).toBe('DOWN')
    const result = interpreter.update(sample(10, 100), baseline)

    expect(result.action).toBe('NEUTRAL')
    expect(result.pendingAction).toBeNull()
  })

  it('usa histerese para manter o gesto ate o limite de saida', () => {
    const interpreter = new GestureInterpreter()
    interpreter.update(sample(17, 0), baseline)
    interpreter.update(sample(17, 120), baseline)

    expect(interpreter.update(sample(14, 1_000), baseline).action).toBe('DOWN')
    expect(interpreter.update(sample(13, 2_000), baseline).action).toBe('NEUTRAL')
  })

  it('produz intensidade proporcional e limitada', () => {
    const interpreter = new GestureInterpreter()
    interpreter.update(sample(17, 0), baseline)
    const moderate = interpreter.update(sample(17, 120), baseline)
    const maximum = interpreter.update(sample(40, 1_000), baseline)

    expect(moderate.intensity).toBeGreaterThan(0)
    expect(moderate.intensity).toBeLessThan(1)
    expect(maximum.intensity).toBe(1)
  })

  it('interrompe imediatamente em baixa confianca ou perda da face', () => {
    const interpreter = new GestureInterpreter()
    interpreter.update(sample(17, 0), baseline)
    expect(interpreter.update(sample(17, 120), baseline).action).toBe('DOWN')

    expect(interpreter.update(sample(25, 140, 0.2), baseline).action).toBe('NEUTRAL')
    expect(interpreter.update(null, baseline).action).toBe('NEUTRAL')
  })

  it('reduz os limites quando a sensibilidade aumenta', () => {
    const interpreter = new GestureInterpreter()
    const standard = interpreter.getThresholds()

    interpreter.setSensitivity(140)

    expect(interpreter.getThresholds().entryDegrees).toBeLessThan(standard.entryDegrees)
  })
})
