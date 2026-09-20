import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Cifras Scroll',
    description: 'Controle o scroll da aba atual com movimentos da cabeça processados localmente.',
    version: '0.2.0',
    minimum_chrome_version: '116',
    permissions: ['activeTab', 'scripting', 'storage', 'offscreen'],
    action: {
      default_title: 'Cifras Scroll',
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
  },
})
