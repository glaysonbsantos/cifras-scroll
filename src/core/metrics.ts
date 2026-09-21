import { percentile } from './statistics'
import type { InferenceMetrics, ScrollAction } from './types'

const METRICS_WINDOW_MS = 5_000

export class MetricsTracker {
  private timestamps: number[] = []
  private latencies: number[] = []
  private previousAction: ScrollAction = 'NEUTRAL'
  private previousFacePresent = false
  private stateChanges = 0
  private faceLosses = 0
  private faceRecoveries = 0

  reset(): void {
    this.timestamps = []
    this.latencies = []
    this.previousAction = 'NEUTRAL'
    this.previousFacePresent = false
    this.stateChanges = 0
    this.faceLosses = 0
    this.faceRecoveries = 0
  }

  record(timestamp: number, latencyMs: number, action: ScrollAction, facePresent: boolean): void {
    const windowStart = timestamp - METRICS_WINDOW_MS
    this.timestamps.push(timestamp)
    this.latencies.push(latencyMs)

    while ((this.timestamps[0] ?? timestamp) < windowStart) {
      this.timestamps.shift()
      this.latencies.shift()
    }

    if (action !== this.previousAction) this.stateChanges += 1
    if (this.previousFacePresent && !facePresent) this.faceLosses += 1
    if (!this.previousFacePresent && facePresent) this.faceRecoveries += 1

    this.previousAction = action
    this.previousFacePresent = facePresent
  }

  snapshot(): InferenceMetrics {
    const duration = (this.timestamps.at(-1) ?? 0) - (this.timestamps[0] ?? 0)
    const fps = duration > 0 ? ((this.timestamps.length - 1) * 1_000) / duration : 0

    return {
      fps,
      latencyMs: this.latencies.at(-1) ?? 0,
      latencyP50Ms: percentile(this.latencies, 0.5),
      latencyP95Ms: percentile(this.latencies, 0.95),
      processingLoadPercent: duration > 0
        ? Math.min(100, (this.latencies.reduce((sum, value) => sum + value, 0) / duration) * 100)
        : 0,
      stateChanges: this.stateChanges,
      faceLosses: this.faceLosses,
      faceRecoveries: this.faceRecoveries,
    }
  }
}
