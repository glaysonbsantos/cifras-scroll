import { describe, expect, it } from 'vitest'
import {
  EXTENSION_HOST_PERMISSIONS,
  EXTENSION_ICONS,
  EXTENSION_PAGE_CSP,
  EXTENSION_PERMISSIONS,
} from './manifestPolicy'

describe('política de privacidade do manifest', () => {
  it('mantém somente as permissões mínimas aprovadas e nenhum host permanente', () => {
    expect(EXTENSION_PERMISSIONS).toEqual(['activeTab', 'scripting', 'storage', 'offscreen'])
    expect(EXTENSION_HOST_PERMISSIONS).toEqual([])
  })

  it('limita conexões das páginas da extensão aos próprios assets', () => {
    expect(EXTENSION_PAGE_CSP).toContain("connect-src 'self'")
    expect(EXTENSION_PAGE_CSP).not.toMatch(/https?:/)
  })

  it('declara todos os tamanhos de ícone exigidos para distribuição', () => {
    expect(EXTENSION_ICONS).toEqual({
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    })
  })
})
