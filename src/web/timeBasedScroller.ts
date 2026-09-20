import type { ScrollIntent } from '../core/types'

type RequestFrame = (callback: FrameRequestCallback) => number
type CancelFrame = (handle: number) => void
type ScrollBy = (deltaY: number) => void

const MAX_FRAME_INTERVAL_MS = 50

export class TimeBasedScroller {
  private intent: ScrollIntent = {
    action: 'NEUTRAL',
    intensity: 0,
    relativePitch: 0,
    filteredPitch: null,
    pendingAction: null,
    dwellProgress: 0,
  }
  private maximumSpeedPixelsPerSecond = 720
  private animationFrameId: number | null = null
  private previousTimestamp: number | null = null

  constructor(
    private readonly scrollBy: ScrollBy = (deltaY) => window.scrollBy({ top: deltaY, behavior: 'auto' }),
    private readonly requestFrame: RequestFrame = requestAnimationFrame,
    private readonly cancelFrame: CancelFrame = cancelAnimationFrame,
  ) {}

  setIntent(intent: ScrollIntent): void {
    this.intent = intent

    if (intent.action === 'NEUTRAL' || intent.intensity <= 0) {
      this.stop()
      return
    }

    if (this.animationFrameId === null) {
      this.previousTimestamp = null
      this.animationFrameId = this.requestFrame((timestamp) => this.tick(timestamp))
    }
  }

  setMaximumSpeed(pixelsPerSecond: number): void {
    this.maximumSpeedPixelsPerSecond = Math.max(0, pixelsPerSecond)
  }

  stop(): void {
    if (this.animationFrameId !== null) this.cancelFrame(this.animationFrameId)
    this.animationFrameId = null
    this.previousTimestamp = null
  }

  private tick(timestamp: number): void {
    this.animationFrameId = null

    if (this.intent.action === 'NEUTRAL' || this.intent.intensity <= 0) {
      this.previousTimestamp = null
      return
    }

    if (this.previousTimestamp !== null) {
      const elapsedMs = Math.min(
        MAX_FRAME_INTERVAL_MS,
        Math.max(0, timestamp - this.previousTimestamp),
      )
      const direction = this.intent.action === 'DOWN' ? 1 : -1
      const distance = direction
        * this.maximumSpeedPixelsPerSecond
        * this.intent.intensity
        * (elapsedMs / 1_000)

      this.scrollBy(distance)
    }

    this.previousTimestamp = timestamp
    this.animationFrameId = this.requestFrame((nextTimestamp) => this.tick(nextTimestamp))
  }
}
