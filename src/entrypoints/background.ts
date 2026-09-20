import { browser } from 'wxt/browser'
import {
  type CommandResponse,
  type ContentCommand,
  isOffscreenEvent,
  isPopupCommand,
  type OffscreenCommand,
  type OffscreenEvent,
  type SessionSnapshot,
  type StateChangedEvent,
} from '../extension/messages'
import { OffscreenDocumentManager } from '../extension/offscreenManager'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  SETTINGS_STORAGE_KEY,
  type ExtensionSettings,
} from '../extension/settings'

const initialState = (): SessionSnapshot => ({
  phase: 'IDLE',
  tabId: null,
  tabTitle: null,
  message: 'Pronto para ativar o controle nesta aba.',
  facePresent: false,
  calibrationProgress: 0,
  intent: 'NEUTRAL',
  settings: { ...DEFAULT_SETTINGS },
})

export default defineBackground(() => {
  let state = initialState()

  const offscreen = new OffscreenDocumentManager({
    resolveUrl: () => browser.runtime.getURL('/offscreen.html'),
    findDocuments: (url) => browser.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [url],
    }),
    createDocument: (path) => browser.offscreen.createDocument({
      url: path,
      reasons: ['USER_MEDIA'],
      justification: 'Capturar vídeo localmente para interpretar movimentos da cabeça durante a sessão ativa.',
    }),
    closeDocument: () => browser.offscreen.closeDocument(),
  })

  void loadSettings()

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      void browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') })
    }
  })

  browser.runtime.onMessage.addListener((message) => {
    if (isOffscreenEvent(message)) {
      return handleOffscreenEvent(message)
    }

    if (!isPopupCommand(message)) return undefined

    switch (message.type) {
      case 'GET_STATE':
        return Promise.resolve(response())
      case 'START_SESSION':
        return startSession()
      case 'STOP_SESSION':
        return stopSession()
      case 'RESUME_SESSION':
        return resumeSession()
      case 'RECALIBRATE':
        return recalibrate()
      case 'UPDATE_SETTINGS':
        return updateSettings(message.settings)
      case 'OPEN_ONBOARDING':
        return openOnboarding()
    }
  })

  async function loadSettings(): Promise<void> {
    const stored = await browser.storage.local.get(SETTINGS_STORAGE_KEY)
    state = {
      ...state,
      settings: normalizeSettings(stored[SETTINGS_STORAGE_KEY]),
    }
    await broadcastState()
  }

  async function startSession(): Promise<CommandResponse> {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab?.id == null || !isSupportedPage(tab.url)) {
        throw new Error('Abra uma página comum com endereço http ou https para ativar o scroll.')
      }

      if (state.tabId !== null && state.tabId !== tab.id) {
        await stopSession()
      }

      state = {
        ...state,
        phase: 'STARTING',
        tabId: tab.id,
        tabTitle: tab.title ?? 'Aba atual',
        message: 'Preparando o processamento local da câmera…',
        facePresent: false,
        calibrationProgress: 0,
        intent: 'NEUTRAL',
      }
      await broadcastState()

      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/scroll-control.js'],
      })
      await sendToTab(tab.id, {
        type: 'SCROLL_SETTINGS',
        maximumSpeed: state.settings.maximumSpeed,
      })

      await offscreen.ensureDocument()
      const command: OffscreenCommand = {
        target: 'offscreen',
        type: 'START_PIPELINE',
        settings: state.settings,
      }
      const result = await browser.runtime.sendMessage(command) as CommandResponse | undefined
      if (result && !result.ok) throw new Error(result.error ?? 'Não foi possível iniciar a câmera.')

      return response()
    } catch (reason) {
      const error = asError(reason)
      await stopTargetScroll()
      await offscreen.closeDocument().catch(() => undefined)
      state = {
        ...state,
        phase: 'ERROR',
        message: cameraErrorMessage(error),
        facePresent: false,
        calibrationProgress: 0,
        intent: 'NEUTRAL',
      }
      await broadcastState()
      return response(error.message)
    }
  }

  async function stopSession(): Promise<CommandResponse> {
    const tabId = state.tabId
    await stopTargetScroll()

    try {
      const command: OffscreenCommand = { target: 'offscreen', type: 'STOP_PIPELINE' }
      await browser.runtime.sendMessage(command)
    } catch {
      // O documento pode já ter sido encerrado; o fechamento abaixo é idempotente.
    }

    await offscreen.closeDocument().catch(() => undefined)
    state = {
      ...initialState(),
      settings: state.settings,
      message: tabId === null
        ? 'Nenhuma sessão estava ativa.'
        : 'Sessão encerrada e câmera liberada.',
    }
    await broadcastState()
    return response()
  }

  async function recalibrate(): Promise<CommandResponse> {
    if (state.tabId === null || !['ACTIVE', 'CALIBRATING', 'PAUSED'].includes(state.phase)) {
      return response('Não há uma sessão ativa para recalibrar.')
    }

    await sendToTab(state.tabId, { type: 'STOP_SCROLL' })
    const command: OffscreenCommand = { target: 'offscreen', type: 'RECALIBRATE' }
    await browser.runtime.sendMessage(command)
    return response()
  }

  async function resumeSession(): Promise<CommandResponse> {
    if (state.tabId === null || state.phase !== 'PAUSED') {
      return response('A sessão não está pausada.')
    }

    const command: OffscreenCommand = { target: 'offscreen', type: 'RESUME_PIPELINE' }
    await browser.runtime.sendMessage(command)
    return response()
  }

  async function updateSettings(settings: ExtensionSettings): Promise<CommandResponse> {
    const normalized = normalizeSettings(settings)
    state = { ...state, settings: normalized }
    await browser.storage.local.set({ [SETTINGS_STORAGE_KEY]: normalized })

    if (state.tabId !== null) {
      await sendToTab(state.tabId, {
        type: 'SCROLL_SETTINGS',
        maximumSpeed: normalized.maximumSpeed,
      })
      const command: OffscreenCommand = {
        target: 'offscreen',
        type: 'UPDATE_SETTINGS',
        settings: normalized,
      }
      await browser.runtime.sendMessage(command).catch(() => undefined)
    }

    await broadcastState()
    return response()
  }

  async function openOnboarding(): Promise<CommandResponse> {
    await browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') })
    return response()
  }

  async function handleOffscreenEvent(message: OffscreenEvent): Promise<void> {
    if (message.type === 'SCROLL_INTENT') {
      if (state.tabId !== null) {
        await sendToTab(state.tabId, { type: 'SCROLL_INTENT', intent: message.intent })
      }
      return
    }

    state = { ...state, ...message.status }
    if (message.status.phase === 'ERROR') await stopTargetScroll()
    await broadcastState()
  }

  async function stopTargetScroll(): Promise<void> {
    if (state.tabId === null) return
    await sendToTab(state.tabId, { type: 'STOP_SCROLL' })
  }

  async function sendToTab(tabId: number, message: ContentCommand): Promise<void> {
    await browser.tabs.sendMessage(tabId, message).catch(() => undefined)
  }

  async function broadcastState(): Promise<void> {
    const event: StateChangedEvent = { target: 'popup', type: 'STATE_CHANGED', state }
    await browser.runtime.sendMessage(event).catch(() => undefined)
  }

  function response(error?: string): CommandResponse {
    return error ? { ok: false, error, state } : { ok: true, state }
  }
})

function isSupportedPage(url?: string): boolean {
  return Boolean(url && (url.startsWith('https://') || url.startsWith('http://')))
}

function asError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason))
}

function cameraErrorMessage(error: Error): string {
  if (error.name === 'NotAllowedError') {
    return 'A câmera não foi autorizada. Abra a tela de permissão e tente novamente.'
  }
  if (error.name === 'NotFoundError') return 'Nenhuma câmera de vídeo foi encontrada.'
  if (error.name === 'NotReadableError') return 'A câmera está ocupada ou indisponível.'
  return error.message
}
