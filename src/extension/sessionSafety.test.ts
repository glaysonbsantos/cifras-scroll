import { describe, expect, it } from 'vitest'
import {
  cameraFailureMessage,
  classifyCameraFailure,
  isSupportedPageUrl,
  pageFailureMessage,
} from './sessionSafety'

describe('segurança da sessão', () => {
  it('aceita somente páginas http e https', () => {
    expect(isSupportedPageUrl('https://example.com/cifra')).toBe(true)
    expect(isSupportedPageUrl('http://localhost:5173')).toBe(true)
    expect(isSupportedPageUrl('chrome://settings')).toBe(false)
    expect(isSupportedPageUrl('https-malformed')).toBe(false)
  })

  it.each([
    ['NotAllowedError', 'PERMISSION_DENIED'],
    ['NotFoundError', 'CAMERA_MISSING'],
    ['NotReadableError', 'CAMERA_BUSY'],
    ['OverconstrainedError', 'CONSTRAINT_UNAVAILABLE'],
    ['CameraDisconnectedError', 'CAMERA_DISCONNECTED'],
  ] as const)('classifica %s sem depender do texto do navegador', (name, expected) => {
    const error = new Error('mensagem variável')
    error.name = name
    expect(classifyCameraFailure(error)).toBe(expected)
  })

  it('explica falhas de câmera e páginas protegidas em linguagem acionável', () => {
    const cameraError = new Error('Permission denied')
    cameraError.name = 'NotAllowedError'

    expect(cameraFailureMessage(cameraError)).toContain('negada ou revogada')
    expect(pageFailureMessage('chrome://extensions')).toContain('protegida pelo navegador')
  })
})
