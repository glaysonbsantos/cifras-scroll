export type ScrollAction = 'UP' | 'DOWN' | 'NEUTRAL'

export interface HeadPoseSample {
  pitch: number
  yaw: number
  roll: number
  confidence: number
  timestamp: number
}

export interface NeutralPose {
  pitch: number
  yaw: number
  roll: number
}

export interface ScrollIntent {
  action: ScrollAction
  intensity: number
  relativePitch: number
  filteredPitch: number | null
  pendingAction: Exclude<ScrollAction, 'NEUTRAL'> | null
  dwellProgress: number
}

export interface InferenceMetrics {
  fps: number
  latencyMs: number
  latencyP50Ms: number
  latencyP95Ms: number
  stateChanges: number
  faceLosses: number
  faceRecoveries: number
}
