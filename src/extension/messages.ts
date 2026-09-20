import type { ScrollIntent } from '../core/types'
import type { ExtensionSettings } from './settings'

export type SessionPhase = 'IDLE' | 'STARTING' | 'CALIBRATING' | 'ACTIVE' | 'PAUSED' | 'ERROR'

export interface SessionSnapshot {
  phase: SessionPhase
  tabId: number | null
  tabTitle: string | null
  message: string
  facePresent: boolean
  calibrationProgress: number
  intent: ScrollIntent['action']
  settings: ExtensionSettings
}

export type PopupCommand =
  | { target: 'background'; type: 'GET_STATE' }
  | { target: 'background'; type: 'START_SESSION' }
  | { target: 'background'; type: 'STOP_SESSION' }
  | { target: 'background'; type: 'RESUME_SESSION' }
  | { target: 'background'; type: 'RECALIBRATE' }
  | { target: 'background'; type: 'UPDATE_SETTINGS'; settings: ExtensionSettings }
  | { target: 'background'; type: 'OPEN_ONBOARDING' }

export type OffscreenCommand =
  | { target: 'offscreen'; type: 'START_PIPELINE'; settings: ExtensionSettings }
  | { target: 'offscreen'; type: 'STOP_PIPELINE' }
  | { target: 'offscreen'; type: 'RESUME_PIPELINE' }
  | { target: 'offscreen'; type: 'RECALIBRATE' }
  | { target: 'offscreen'; type: 'UPDATE_SETTINGS'; settings: ExtensionSettings }

export type OffscreenEvent =
  | {
    target: 'background'
    type: 'OFFSCREEN_STATUS'
    status: Pick<SessionSnapshot, 'phase' | 'message' | 'facePresent' | 'calibrationProgress' | 'intent'>
  }
  | { target: 'background'; type: 'SCROLL_INTENT'; intent: ScrollIntent }

export type ContentCommand =
  | { type: 'SCROLL_INTENT'; intent: ScrollIntent }
  | { type: 'SCROLL_SETTINGS'; maximumSpeed: number }
  | { type: 'STOP_SCROLL' }
  | { type: 'PING_SCROLL_CONTENT' }

export interface StateChangedEvent {
  target: 'popup'
  type: 'STATE_CHANGED'
  state: SessionSnapshot
}

export interface CommandResponse {
  ok: boolean
  state?: SessionSnapshot
  error?: string
}

export function isPopupCommand(message: unknown): message is PopupCommand {
  return hasTarget(message, 'background') && typeof message.type === 'string'
}

export function isOffscreenCommand(message: unknown): message is OffscreenCommand {
  return hasTarget(message, 'offscreen') && typeof message.type === 'string'
}

export function isOffscreenEvent(message: unknown): message is OffscreenEvent {
  return hasTarget(message, 'background')
    && typeof message.type === 'string'
    && (message.type === 'OFFSCREEN_STATUS' || message.type === 'SCROLL_INTENT')
}

export function isContentCommand(message: unknown): message is ContentCommand {
  if (!message || typeof message !== 'object' || !('type' in message)) return false
  return ['SCROLL_INTENT', 'SCROLL_SETTINGS', 'STOP_SCROLL', 'PING_SCROLL_CONTENT']
    .includes(String(message.type))
}

function hasTarget<T extends string>(message: unknown, target: T): message is Record<'target' | 'type', unknown> & { target: T } {
  return Boolean(message && typeof message === 'object' && 'target' in message && message.target === target)
}
