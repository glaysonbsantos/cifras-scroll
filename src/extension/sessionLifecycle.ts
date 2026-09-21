import type { PipelineSnapshot } from './messages'
import { isSupportedPageUrl } from './sessionSafety'

interface RecoverableTab {
  id?: number
  url?: string
  active: boolean
}

export function hasRecoverableTarget(snapshot?: PipelineSnapshot): snapshot is PipelineSnapshot & { tabId: number } {
  return Boolean(snapshot?.running && snapshot.tabId !== null)
}

export function canResumePipeline(
  snapshot: PipelineSnapshot & { tabId: number },
  tab: RecoverableTab,
  contentAvailable: boolean,
): boolean {
  return tab.id === snapshot.tabId
    && tab.active
    && isSupportedPageUrl(tab.url)
    && contentAvailable
}

export function shouldEndForTabUpdate(
  targetTabId: number | null,
  updatedTabId: number,
  change: { status?: string; url?: string },
): boolean {
  return targetTabId === updatedTabId && (change.status === 'loading' || change.url !== undefined)
}
