// @ts-expect-error O Vitest fornece Node em runtime; os tipos Node não fazem parte do pacote da extensão.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function pngSize(path: URL): { width: number; height: number } {
  const bytes = readFileSync(path)
  expect(bytes.subarray(1, 4).toString()).toBe('PNG')
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

describe('assets de distribuição', () => {
  it.each([16, 32, 48, 128])('mantém o ícone %d×%d no tamanho declarado', (size) => {
    expect(pngSize(new URL(`../../public/icons/icon-${size}.png`, import.meta.url)))
      .toEqual({ width: size, height: size })
  })

  it('mantém os materiais obrigatórios da loja nas dimensões finais', () => {
    expect(pngSize(new URL('../../store/assets/icon-128.png', import.meta.url)))
      .toEqual({ width: 128, height: 128 })
    expect(pngSize(new URL('../../store/assets/promo-440x280.png', import.meta.url)))
      .toEqual({ width: 440, height: 280 })
    expect(pngSize(new URL('../../store/assets/screenshot-onboarding-1280x800.png', import.meta.url)))
      .toEqual({ width: 1280, height: 800 })
    expect(pngSize(new URL('../../store/assets/screenshot-popup-1280x800.png', import.meta.url)))
      .toEqual({ width: 1280, height: 800 })
  })
})
