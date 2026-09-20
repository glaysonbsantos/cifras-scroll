import { browser } from 'wxt/browser'
import { isContentCommand } from '../extension/messages'
import { TimeBasedScroller } from '../web/timeBasedScroller'

interface ScrollController {
  dispose(): void
}

declare global {
  var __cifrasScrollController: ScrollController | undefined
}

export default defineUnlistedScript(() => {
  globalThis.__cifrasScrollController?.dispose()

  const scroller = new TimeBasedScroller()
  const onMessage = (message: unknown) => {
    if (!isContentCommand(message)) return undefined

    switch (message.type) {
      case 'SCROLL_INTENT':
        scroller.setIntent(message.intent)
        return Promise.resolve({ ok: true })
      case 'SCROLL_SETTINGS':
        scroller.setMaximumSpeed(message.maximumSpeed)
        return Promise.resolve({ ok: true })
      case 'STOP_SCROLL':
        scroller.stop()
        return Promise.resolve({ ok: true })
      case 'PING_SCROLL_CONTENT':
        return Promise.resolve({ ok: true })
    }
  }

  browser.runtime.onMessage.addListener(onMessage)
  globalThis.__cifrasScrollController = {
    dispose() {
      scroller.stop()
      browser.runtime.onMessage.removeListener(onMessage)
    },
  }
})
