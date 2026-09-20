export interface ExtensionSettings {
  sensitivity: number
  maximumSpeed: number
}

export const SETTINGS_LIMITS = {
  sensitivity: { minimum: 70, maximum: 140, step: 5 },
  maximumSpeed: { minimum: 240, maximum: 1_200, step: 40 },
} as const

export const DEFAULT_SETTINGS: ExtensionSettings = {
  sensitivity: 100,
  maximumSpeed: 720,
}

export const SETTINGS_STORAGE_KEY = 'settings'

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function normalizeSettings(value: unknown): ExtensionSettings {
  const candidate = value && typeof value === 'object'
    ? value as Partial<ExtensionSettings>
    : {}

  return {
    sensitivity: clamp(
      finiteNumber(candidate.sensitivity, DEFAULT_SETTINGS.sensitivity),
      SETTINGS_LIMITS.sensitivity.minimum,
      SETTINGS_LIMITS.sensitivity.maximum,
    ),
    maximumSpeed: clamp(
      finiteNumber(candidate.maximumSpeed, DEFAULT_SETTINGS.maximumSpeed),
      SETTINGS_LIMITS.maximumSpeed.minimum,
      SETTINGS_LIMITS.maximumSpeed.maximum,
    ),
  }
}
