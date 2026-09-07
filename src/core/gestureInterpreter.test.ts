import { describe, expect, it } from 'vitest'
import { interpretGesture } from './gestureInterpreter'
import type { HeadPoseSample, NeutralPose } from './types'

const baseline: NeutralPose = { pitch: 10, yaw: 0, roll: 0 }

function sample(pitch: number, confidence = 1): HeadPoseSample {
  return { pitch, yaw: 0, roll: 0, confidence, timestamp: 0 }
}

describe('interpretGesture', () => {
  it('permanece neutro dentro do limite inicial', () => {
    expect(interpretGesture(sample(15), baseline).action).toBe('NEUTRAL')
  })

  it('produz intencoes relativas ao baseline', () => {
    expect(interpretGesture(sample(17), baseline).action).toBe('DOWN')
    expect(interpretGesture(sample(3), baseline).action).toBe('UP')
  })

  it('interrompe em baixa confianca', () => {
    expect(interpretGesture(sample(25, 0.2), baseline).action).toBe('NEUTRAL')
  })
})
