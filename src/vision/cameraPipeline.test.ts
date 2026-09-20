import { describe, expect, it, vi } from 'vitest'
import type { DetectionFrame } from './facePoseDetector'
import { CameraPipeline, type CameraDetector } from './cameraPipeline'

function cameraFixture() {
  const stopTrack = vi.fn()
  const track = {
    getSettings: () => ({ width: 640, height: 480, frameRate: 30 }),
    stop: stopTrack,
  } as unknown as MediaStreamTrack
  const stream = {
    getVideoTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream
  return { stopTrack, stream, track }
}

describe('CameraPipeline', () => {
  it('processa frames da faixa sem depender de requestAnimationFrame', async () => {
    const { stopTrack, stream } = cameraFixture()
    const closeFrame = vi.fn()
    const frame = { close: closeFrame } as unknown as VideoFrame
    const pending = new Promise<ReadableStreamReadResult<VideoFrame>>(() => undefined)
    const read = vi.fn()
      .mockResolvedValueOnce({ done: false, value: frame })
      .mockReturnValue(pending)
    const cancel = vi.fn().mockResolvedValue(undefined)
    const detected: DetectionFrame = {
      sample: null,
      facePresent: false,
      latencyMs: 2,
      timestamp: 42,
    }
    const detector: CameraDetector = {
      initialize: vi.fn().mockResolvedValue(undefined),
      detect: vi.fn().mockReturnValue(detected),
      close: vi.fn(),
    }
    const onFrame = vi.fn()
    const pipeline = new CameraPipeline(
      { onFrame, onCameraReady: vi.fn(), onError: vi.fn() },
      {
        detector,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        createFrameReader: () => ({ read, cancel } as unknown as ReadableStreamDefaultReader<VideoFrame>),
        now: () => 42,
      },
    )

    await pipeline.start()
    await vi.waitFor(() => expect(onFrame).toHaveBeenCalledWith(detected))

    expect(detector.detect).toHaveBeenCalledWith(frame, 42)
    expect(closeFrame).toHaveBeenCalledOnce()

    pipeline.stop()
    expect(cancel).toHaveBeenCalledOnce()
    expect(stopTrack).toHaveBeenCalledOnce()
  })

  it('libera o frame e interrompe a câmera quando a inferência falha', async () => {
    const { stopTrack, stream } = cameraFixture()
    const closeFrame = vi.fn()
    const frame = { close: closeFrame } as unknown as VideoFrame
    const detector: CameraDetector = {
      initialize: vi.fn().mockResolvedValue(undefined),
      detect: vi.fn(() => { throw new Error('falha de inferência') }),
      close: vi.fn(),
    }
    const onError = vi.fn()
    const pipeline = new CameraPipeline(
      { onFrame: vi.fn(), onCameraReady: vi.fn(), onError },
      {
        detector,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        createFrameReader: () => ({
          read: vi.fn().mockResolvedValue({ done: false, value: frame }),
          cancel: vi.fn().mockResolvedValue(undefined),
        } as unknown as ReadableStreamDefaultReader<VideoFrame>),
      },
    )

    await pipeline.start()
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())

    expect(closeFrame).toHaveBeenCalledOnce()
    expect(stopTrack).toHaveBeenCalledOnce()
  })
})
