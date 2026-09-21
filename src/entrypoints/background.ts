import { browser } from 'wxt/browser'
import {
  type CommandResponse,
  type ContentCommand,
  isOffscreenEvent,
  isPopupCommand,
  type OffscreenCommand,
  type OffscreenEvent,
  type OffscreenResponse,
  type SessionSnapshot,
  type StateChangedEvent,
} from '../extension/messages'
import { OffscreenDocumentManager } from '../extension/offscreenManager'
import {
  canResumePipeline,
  hasRecoverableTarget,
  shouldEndForTabUpdate,
} from '../extension/sessionLifecycle'
import {
  cameraFailureMessage,
  isSupportedPageUrl,
  namedError,
  pageFailureMessage,
} from '../extension/sessionSafety'
import { EMERGENCY_STOP_COMMAND } from '../extension/emergencyStop'
import { sessionIndicator } from '../extension/sessionIndicator'
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
  metrics: null,
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

  const ready = initialize()

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      void browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') })
    }
  })

  browser.commands.onCommand.addListener((command) => {
    if (command === EMERGENCY_STOP_COMMAND) {
      void ready.then(() => stopSession())
    }
  })

  browser.tabs.onRemoved.addListener((tabId) => {
    void ready.then(async () => {
      if (state.tabId === tabId) {
        await endSession('A aba controlada foi fechada. A câmera foi liberada.')
      }
    })
  })

  browser.tabs.onActivated.addListener(({ tabId }) => {
    void ready.then(async () => {
      if (state.tabId !== null && state.tabId !== tabId) {
        await endSession('A sessão foi encerrada ao trocar de aba. Ative novamente na aba desejada.')
      }
    })
  })

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    void ready.then(async () => {
      if (shouldEndForTabUpdate(state.tabId, tabId, changeInfo)) {
        await endSession('A sessão foi encerrada porque a aba navegou ou foi recarregada.')
      }
    })
  })

  browser.windows.onFocusChanged.addListener((windowId) => {
    void ready.then(async () => {
      if (state.tabId === null || windowId === browser.windows.WINDOW_ID_NONE) return
      const target = await browser.tabs.get(state.tabId).catch(() => undefined)
      if (target && target.windowId !== windowId) {
        await endSession('A sessão foi encerrada ao trocar de janela. Ative novamente na aba desejada.')
      }
    })
  })

  browser.runtime.onMessage.addListener((message) => {
    if (isOffscreenEvent(message)) {
      return ready.then(() => handleOffscreenEvent(message))
    }

    if (!isPopupCommand(message)) return undefined

    return ready.then(() => {
      switch (message.type) {
        case 'GET_STATE':
          return refreshState()
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
  })

  async function initialize(): Promise<void> {
    const stored = await browser.storage.local.get(SETTINGS_STORAGE_KEY)
    state = {
      ...state,
      settings: normalizeSettings(stored[SETTINGS_STORAGE_KEY]),
    }
    await recoverSession()
    await broadcastState()
  }

  async function recoverSession(): Promise<void> {
    if (!await offscreen.hasDocument()) return

    try {
      const command: OffscreenCommand = { target: 'offscreen', type: 'GET_PIPELINE_STATE' }
      const result = await browser.runtime.sendMessage(command) as OffscreenResponse | undefined
      const snapshot = result?.snapshot
      if (!result?.ok || !hasRecoverableTarget(snapshot)) {
        await stopOffscreen()
        await offscreen.closeDocument()
        return
      }

      const tab = await browser.tabs.get(snapshot.tabId)
      const eligible = tab.active && isSupportedPageUrl(tab.url)
      const contentAvailable = eligible
        ? await sendToTab(snapshot.tabId, { type: 'PING_SCROLL_CONTENT' })
        : false

      if (!canResumePipeline(snapshot, tab, contentAvailable)) {
        await stopOffscreen()
        await offscreen.closeDocument()
        state = {
          ...initialState(),
          settings: state.settings,
          message: 'A sessão anterior não pôde ser retomada com segurança e a câmera foi liberada.',
        }
        return
      }

      state = {
        ...state,
        ...snapshot.status,
        tabId: snapshot.tabId,
        tabTitle: snapshot.tabTitle ?? tab.title ?? 'Aba atual',
      }
      await sendToTab(snapshot.tabId, {
        type: 'SCROLL_SETTINGS',
        maximumSpeed: state.settings.maximumSpeed,
      })
      await browser.runtime.sendMessage({
        target: 'offscreen',
        type: 'UPDATE_SETTINGS',
        settings: state.settings,
      } satisfies OffscreenCommand)
    } catch {
      await stopOffscreen()
      await offscreen.closeDocument().catch(() => undefined)
      state = {
        ...initialState(),
        settings: state.settings,
        message: 'A sessão anterior foi encerrada com segurança após o reinício da extensão.',
      }
    }
  }

  async function startSession(): Promise<CommandResponse> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (tab?.id == null || !isSupportedPageUrl(tab.url)) {
      return failStart(pageFailureMessage(tab?.url))
    }

    if (state.tabId !== null && state.tabId !== tab.id) {
      await endSession('A sessão anterior foi encerrada.')
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
      metrics: null,
    }
    await broadcastState()

    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/scroll-control.js'],
      })
      if (!await sendToTab(tab.id, {
        type: 'SCROLL_SETTINGS',
        maximumSpeed: state.settings.maximumSpeed,
      })) {
        return failStart(pageFailureMessage(tab.url))
      }
    } catch (reason) {
      return failStart(pageFailureMessage(tab.url, reason))
    }

    try {
      await offscreen.ensureDocument()
      const command: OffscreenCommand = {
        target: 'offscreen',
        type: 'START_PIPELINE',
        settings: state.settings,
        tabId: tab.id,
        tabTitle: tab.title ?? 'Aba atual',
      }
      const result = await browser.runtime.sendMessage(command) as OffscreenResponse | undefined
      if (!result?.ok) {
        throw namedError(result?.errorName ?? 'Error', result?.error ?? 'Não foi possível iniciar a câmera.')
      }
      return response()
    } catch (reason) {
      return failStart(cameraFailureMessage(reason))
    }
  }

  async function refreshState(): Promise<CommandResponse> {
    if (state.tabId === null || !await offscreen.hasDocument()) return response()

    try {
      const command: OffscreenCommand = { target: 'offscreen', type: 'GET_PIPELINE_STATE' }
      const result = await browser.runtime.sendMessage(command) as OffscreenResponse | undefined
      if (result?.snapshot?.running && result.snapshot.tabId === state.tabId) {
        state = { ...state, ...result.snapshot.status }
      }
    } catch {
      // Eventos de ciclo de vida farão a limpeza; o popup ainda recebe o último estado seguro.
    }
    return response()
  }

  async function failStart(message: string): Promise<CommandResponse> {
    await stopTargetScroll()
    await stopOffscreen()
    await offscreen.closeDocument().catch(() => undefined)
    state = {
      ...state,
      phase: 'ERROR',
      tabId: null,
      message,
      facePresent: false,
      calibrationProgress: 0,
      intent: 'NEUTRAL',
      metrics: null,
    }
    await broadcastState()
    return response(message)
  }

  async function stopSession(): Promise<CommandResponse> {
    const hadSession = state.tabId !== null
    await endSession(hadSession
      ? 'Sessão encerrada e câmera liberada.'
      : 'Nenhuma sessão estava ativa.')
    return response()
  }

  async function endSession(message: string): Promise<void> {
    await stopTargetScroll()
    await stopOffscreen()
    await offscreen.closeDocument().catch(() => undefined)
    state = {
      ...initialState(),
      settings: state.settings,
      message,
    }
    await broadcastState()
  }

  async function stopOffscreen(): Promise<void> {
    try {
      if (!await offscreen.hasDocument()) return
      const command: OffscreenCommand = { target: 'offscreen', type: 'STOP_PIPELINE' }
      await browser.runtime.sendMessage(command)
    } catch {
      // O documento pode desaparecer durante a limpeza; fechar abaixo é idempotente.
    }
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
      if (state.tabId === null || message.tabId !== state.tabId) return
      const delivered = await sendToTab(message.tabId, { type: 'SCROLL_INTENT', intent: message.intent })
      if (!delivered) {
        await endSession('A página deixou de responder. O scroll e a câmera foram interrompidos.')
      }
      return
    }

    state = { ...state, ...message.status }
    if (message.status.phase === 'ERROR') {
      await stopTargetScroll()
      await offscreen.closeDocument().catch(() => undefined)
      state = { ...state, tabId: null }
    }
    await broadcastState()
  }

  async function stopTargetScroll(): Promise<void> {
    if (state.tabId === null) return
    await sendToTab(state.tabId, { type: 'STOP_SCROLL' })
  }

  async function sendToTab(tabId: number, message: ContentCommand): Promise<boolean> {
    try {
      await browser.tabs.sendMessage(tabId, message)
      return true
    } catch {
      return false
    }
  }

  async function broadcastState(): Promise<void> {
    const indicator = sessionIndicator(state.phase, state.tabTitle)
    await Promise.all([
      browser.action.setBadgeText({ text: indicator.badgeText }),
      browser.action.setBadgeBackgroundColor({ color: indicator.badgeColor }),
      browser.action.setTitle({ title: indicator.title }),
    ]).catch(() => undefined)

    const event: StateChangedEvent = { target: 'popup', type: 'STATE_CHANGED', state }
    await browser.runtime.sendMessage(event).catch(() => undefined)
  }

  function response(error?: string): CommandResponse {
    return error ? { ok: false, error, state } : { ok: true, state }
  }
})
