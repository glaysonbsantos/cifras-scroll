import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings } from './settings'

describe('normalizeSettings', () => {
  it('usa os padrões quando não há preferências salvas', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  })

  it('preserva valores válidos', () => {
    expect(normalizeSettings({ sensitivity: 115, maximumSpeed: 840 })).toEqual({
      sensitivity: 115,
      maximumSpeed: 840,
    })
  })

  it('limita valores persistidos fora da faixa segura', () => {
    expect(normalizeSettings({ sensitivity: 10, maximumSpeed: 9_000 })).toEqual({
      sensitivity: 70,
      maximumSpeed: 1_200,
    })
  })
})
