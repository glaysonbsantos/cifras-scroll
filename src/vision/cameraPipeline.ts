import { FacePoseDetector, type DetectionFrame } from './facePoseDetector'

export interface CameraDetails {
  width: number | null
  height: number | null
  frameRate: number | null
}

interface CameraPipelineCallbacks {
  onFrame: (frame: DetectionFrame) => void
  onCameraReady: (details: CameraDetails) => void
  onError: (error: Error) => void
}

export class CameraPipeline {
  private detector = new FacePoseDetector()
  private stream: MediaStream | null = null
  private animationFrameId: number | null = null
  private lastVideoTime = -1
  private running = false

  constructor(private callbacks: CameraPipelineCallbacks) {}

  async start(video: HTMLVideoElement): Promise<void> {
    if (this.running) return

    try {
      await this.detector.initialize()
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      })

      const [track] = this.stream.getVideoTracks()
      const settings = track?.getSettings()
      this.callbacks.onCameraReady({
        width: settings?.width ?? null,
        height: settings?.height ?? null,
        frameRate: settings?.frameRate ?? null,
      })

      video.srcObject = this.stream
      await video.play()
      this.running = true
      this.lastVideoTime = -1
      this.animationFrameId = requestAnimationFrame(() => this.processFrame(video))
    } catch (reason) {
      this.stop(video)
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.callbacks.onError(error)
      throw error
    }
  }

  stop(video?: HTMLVideoElement): void {
    this.running = false
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.lastVideoTime = -1
    if (video) video.srcObject = null
  }

  dispose(video?: HTMLVideoElement): void {
    this.stop(video)
    this.detector.close()
  }

  private processFrame(video: HTMLVideoElement): void {
    if (!this.running) return

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime
      const timestamp = performance.now()

      try {
        this.callbacks.onFrame(this.detector.detect(video, timestamp))
      } catch (reason) {
        this.stop(video)
        this.callbacks.onError(reason instanceof Error ? reason : new Error(String(reason)))
        return
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.processFrame(video))
  }
}
