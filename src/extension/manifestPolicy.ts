export const EXTENSION_PERMISSIONS = ['activeTab', 'scripting', 'storage', 'offscreen'] as const
export const EXTENSION_HOST_PERMISSIONS = [] as const
export const EXTENSION_PAGE_CSP = "script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; object-src 'self'"
export const EXTENSION_ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
} as const
