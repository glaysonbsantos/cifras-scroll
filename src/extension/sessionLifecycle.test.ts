import { describe, expect, it } from 'vitest'
import type { PipelineSnapshot } from './messages'
import {
  canResumePipeline,
  hasRecoverableTarget,
  shouldEndForTabUpdate,
} from './sessionLifecycle'

const snapshot: PipelineSnapshot = {
  running: true,
  tabId: 42,
  tabTitle: 'Cifra',
  status: {
    phase: 'ACTIVE',
    message: 'Ativo',
    facePresent: true,
    calibrationProgress: 1,
    intent: 'NEUTRAL',
    metrics: null,
  },
}

describe('ciclo de vida da sessão', () => {
  it('recupera somente um pipeline ativo na mesma aba http(s), ainda ativa e responsiva', () => {
    expect(hasRecoverableTarget(snapshot)).toBe(true)
    if (!hasRecoverableTarget(snapshot)) throw new Error('fixture inválida')

    expect(canResumePipeline(snapshot, { id: 42, url: 'https://example.com', active: true }, true)).toBe(true)
    expect(canResumePipeline(snapshot, { id: 42, url: 'https://example.com', active: false }, true)).toBe(false)
    expect(canResumePipeline(snapshot, { id: 42, url: 'chrome://settings', active: true }, true)).toBe(false)
    expect(canResumePipeline(snapshot, { id: 42, url: 'https://example.com', active: true }, false)).toBe(false)
  })

  it('não recupera documento sem pipeline ou aba vinculada', () => {
    expect(hasRecoverableTarget({ ...snapshot, running: false })).toBe(false)
    expect(hasRecoverableTarget({ ...snapshot, tabId: null })).toBe(false)
  })

  it('encerra em recarga ou navegação, mas ignora atualização apenas de título', () => {
    expect(shouldEndForTabUpdate(42, 42, { status: 'loading' })).toBe(true)
    expect(shouldEndForTabUpdate(42, 42, { url: 'https://example.com/outra' })).toBe(true)
    expect(shouldEndForTabUpdate(42, 42, { status: 'complete' })).toBe(false)
    expect(shouldEndForTabUpdate(42, 7, { status: 'loading' })).toBe(false)
  })
})
