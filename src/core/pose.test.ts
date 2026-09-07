import { describe, expect, it } from 'vitest'
import { poseFromTransformationMatrix } from './pose'

const identity = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]

describe('poseFromTransformationMatrix', () => {
  it('extrai pose neutra da matriz identidade', () => {
    expect(poseFromTransformationMatrix({ data: identity }, 0.8, 42)).toEqual({
      pitch: 0,
      yaw: 0,
      roll: 0,
      confidence: 0.8,
      timestamp: 42,
    })
  })

  it('rejeita matrizes incompletas', () => {
    expect(poseFromTransformationMatrix({ data: [1, 0, 0] }, 1, 0)).toBeNull()
  })
})
