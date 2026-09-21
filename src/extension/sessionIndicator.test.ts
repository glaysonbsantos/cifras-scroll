import { describe, expect, it } from 'vitest'
import { sessionIndicator } from './sessionIndicator'

describe('indicador global da sessão', () => {
  it('mostra ON de forma inequívoca durante câmera e controle ativos', () => {
    expect(sessionIndicator('STARTING', 'Minha cifra')).toMatchObject({ badgeText: 'ON' })
    expect(sessionIndicator('CALIBRATING', 'Minha cifra')).toMatchObject({ badgeText: 'ON' })
    expect(sessionIndicator('ACTIVE', 'Minha cifra')).toMatchObject({
      badgeText: 'ON',
      badgeColor: '#18794e',
    })
  })

  it('distingue pausa, falha e sessão desligada', () => {
    expect(sessionIndicator('PAUSED', null).badgeText).toBe('PAUS')
    expect(sessionIndicator('ERROR', null).badgeText).toBe('!')
    expect(sessionIndicator('IDLE', null).badgeText).toBe('')
  })

  it('inclui a aba controlada e a saída de emergência no título', () => {
    const indicator = sessionIndicator('ACTIVE', 'Repertório')
    expect(indicator.title).toContain('Repertório')
    expect(indicator.title).toContain('atalho de emergência')
  })
})
