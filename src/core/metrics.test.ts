import { describe, expect, it } from 'vitest'
import { MetricsTracker } from './metrics'

describe('MetricsTracker', () => {
  it('mede FPS, latência e a parcela de tempo usada pela inferência', () => {
    const tracker = new MetricsTracker()
    tracker.record(0, 100, 'NEUTRAL', true)
    tracker.record(1_000, 100, 'DOWN', true)

    expect(tracker.snapshot()).toMatchObject({
      fps: 1,
      latencyMs: 100,
      latencyP50Ms: 100,
      latencyP95Ms: 100,
      processingLoadPercent: 20,
      stateChanges: 1,
      faceRecoveries: 1,
    })
  })

  it('descarta métricas da sessão anterior ao reiniciar', () => {
    const tracker = new MetricsTracker()
    tracker.record(100, 4, 'UP', false)
    tracker.reset()

    expect(tracker.snapshot()).toMatchObject({
      fps: 0,
      latencyMs: 0,
      processingLoadPercent: 0,
      stateChanges: 0,
      faceLosses: 0,
      faceRecoveries: 0,
    })
  })
})
