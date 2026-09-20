import { describe, expect, it, vi } from 'vitest'
import { OffscreenDocumentManager, type OffscreenPlatform } from './offscreenManager'

function platform(overrides: Partial<OffscreenPlatform> = {}): OffscreenPlatform {
  return {
    resolveUrl: (path) => `chrome-extension://test${path}`,
    findDocuments: vi.fn().mockResolvedValue([]),
    createDocument: vi.fn().mockResolvedValue(undefined),
    closeDocument: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('OffscreenDocumentManager', () => {
  it('reutiliza o documento offscreen existente', async () => {
    const adapter = platform({ findDocuments: vi.fn().mockResolvedValue([{}]) })
    await new OffscreenDocumentManager(adapter).ensureDocument()
    expect(adapter.createDocument).not.toHaveBeenCalled()
  })

  it('cria somente um documento diante de ativações concorrentes', async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => { release = resolve })
    const adapter = platform({ createDocument: vi.fn().mockReturnValue(pending) })
    const manager = new OffscreenDocumentManager(adapter)

    const first = manager.ensureDocument()
    const second = manager.ensureDocument()
    await vi.waitFor(() => expect(adapter.createDocument).toHaveBeenCalledTimes(1))
    release()
    await Promise.all([first, second])
  })

  it('fecha o documento somente quando ele existe', async () => {
    const adapter = platform({ findDocuments: vi.fn().mockResolvedValue([{}]) })
    await new OffscreenDocumentManager(adapter).closeDocument()
    expect(adapter.closeDocument).toHaveBeenCalledOnce()
  })
})
