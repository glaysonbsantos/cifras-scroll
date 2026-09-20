import { describe, expect, it } from 'vitest'
import type { ScrollIntent } from '../core/types'
import { TimeBasedScroller } from './timeBasedScroller'

function intent(action: 'UP' | 'DOWN' | 'NEUTRAL', intensity: number): ScrollIntent {
  return {
    action,
    intensity,
    relativePitch: 0,
    filteredPitch: 0,
    pendingAction: null,
    dwellProgress: 0,
  }
}

describe('TimeBasedScroller', () => {
  it('aplica distancia proporcional ao tempo, intensidade e velocidade', () => {
    const distances: number[] = []
    let callback: FrameRequestCallback | null = null
    let nextId = 0
    const scroller = new TimeBasedScroller(
      (distance) => distances.push(distance),
      (next) => {
        callback = next
        nextId += 1
        return nextId
      },
      () => undefined,
    )
    scroller.setMaximumSpeed(800)
    scroller.setIntent(intent('DOWN', 0.5))

    callback!(1_000)
    callback!(1_020)

    expect(distances).toEqual([8])
  })

  it('inverte o sinal para subir e limita intervalos longos', () => {
    const distances: number[] = []
    let callback: FrameRequestCallback | null = null
    const scroller = new TimeBasedScroller(
      (distance) => distances.push(distance),
      (next) => {
        callback = next
        return 1
      },
      () => undefined,
    )
    scroller.setMaximumSpeed(600)
    scroller.setIntent(intent('UP', 1))

    callback!(1_000)
    callback!(1_500)

    expect(distances).toEqual([-30])
  })

  it('cancela o quadro pendente quando volta ao neutro', () => {
    const cancelled: number[] = []
    const scroller = new TimeBasedScroller(
      () => undefined,
      () => 42,
      (handle) => cancelled.push(handle),
    )

    scroller.setIntent(intent('DOWN', 1))
    scroller.setIntent(intent('NEUTRAL', 0))

    expect(cancelled).toEqual([42])
  })
})
