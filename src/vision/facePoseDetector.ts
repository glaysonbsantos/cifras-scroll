import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision'
import { poseFromTransformationMatrix } from '../core/pose'
import type { HeadPoseSample } from '../core/types'

export interface DetectionFrame {
  sample: HeadPoseSample | null
  facePresent: boolean
  latencyMs: number
  timestamp: number
}

export class FacePoseDetector {
  private landmarker: FaceLandmarker | null = null

  async initialize(): Promise<void> {
    if (this.landmarker) return

    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`
    const wasmRoot = `${baseUrl}mediapipe/wasm`
    const modelPath = `${baseUrl}mediapipe/models/face_landmarker.task`
    const fileset = await FilesetResolver.forVisionTasks(wasmRoot)

    this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: modelPath,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
    })
  }

  detect(image: TexImageSource, timestamp: number): DetectionFrame {
    if (!this.landmarker) throw new Error('Detector não inicializado.')

    const inferenceStartedAt = performance.now()
    const result = this.landmarker.detectForVideo(image, timestamp)
    const latencyMs = performance.now() - inferenceStartedAt
    const matrix = this.firstMatrix(result)
    const facePresent = result.faceLandmarks.length > 0 && matrix !== null

    return {
      sample: matrix
        ? poseFromTransformationMatrix(matrix, 1, timestamp)
        : null,
      facePresent,
      latencyMs,
      timestamp,
    }
  }

  close(): void {
    this.landmarker?.close()
    this.landmarker = null
  }

  private firstMatrix(result: FaceLandmarkerResult) {
    return result.facialTransformationMatrixes[0] ?? null
  }
}
