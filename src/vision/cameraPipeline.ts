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

export interface CameraDetector {
  initialize(): Promise<void>
  detect(image: TexImageSource, timestamp: number): DetectionFrame
  close(): void
}

interface CameraPipelineDependencies {
  detector?: CameraDetector
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  createFrameReader?: (track: MediaStreamTrack) => ReadableStreamDefaultReader<VideoFrame>
  now?: () => number
}

export class CameraPipeline {
  private detector: CameraDetector
  private getUserMedia: NonNullable<CameraPipelineDependencies['getUserMedia']>
  private createFrameReader: NonNullable<CameraPipelineDependencies['createFrameReader']>
  private now: NonNullable<CameraPipelineDependencies['now']>
  private stream: MediaStream | null = null
  private frameReader: ReadableStreamDefaultReader<VideoFrame> | null = null
  private running = false
  private runId = 0

  constructor(
    private callbacks: CameraPipelineCallbacks,
    dependencies: CameraPipelineDependencies = {},
  ) {
    this.detector = dependencies.detector ?? new FacePoseDetector()
    this.getUserMedia = dependencies.getUserMedia
      ?? ((constraints) => navigator.mediaDevices.getUserMedia(constraints))
    this.createFrameReader = dependencies.createFrameReader
      ?? ((track) => new MediaStreamTrackProcessor({ track, maxBufferSize: 1 }).readable.getReader())
    this.now = dependencies.now ?? (() => performance.now())
  }

  async start(): Promise<void> {
    if (this.running) return

    try {
      await this.detector.initialize()
      this.stream = await this.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      })

      const [track] = this.stream?.getVideoTracks() ?? []
      if (!track) throw new Error('A câmera não forneceu uma faixa de vídeo.')
      const settings = track?.getSettings()
      this.callbacks.onCameraReady({
        width: settings?.width ?? null,
        height: settings?.height ?? null,
        frameRate: settings?.frameRate ?? null,
      })

      this.running = true
      const currentRunId = ++this.runId
      this.frameReader = this.createFrameReader(track)
      void this.processFrames(this.frameReader, currentRunId)
    } catch (reason) {
      this.stop()
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.callbacks.onError(error)
      throw error
    }
  }

  stop(): void {
    this.running = false
    this.runId += 1
    void this.frameReader?.cancel().catch(() => undefined)
    this.frameReader = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
  }

  dispose(): void {
    this.stop()
    this.detector.close()
  }

  private async processFrames(
    reader: ReadableStreamDefaultReader<VideoFrame>,
    runId: number,
  ): Promise<void> {
    try {
      while (this.running && runId === this.runId) {
        const result = await reader.read()
        if (result.done || !result.value) return

        try {
          this.callbacks.onFrame(this.detector.detect(result.value, this.now()))
        } finally {
          result.value.close()
        }
      }
    } catch (reason) {
      if (!this.running || runId !== this.runId) return
      this.stop()
      this.callbacks.onError(reason instanceof Error ? reason : new Error(String(reason)))
    }
  }
}
