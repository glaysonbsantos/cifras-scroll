import { defineConfig } from 'wxt'
import {
  EXTENSION_HOST_PERMISSIONS,
  EXTENSION_PAGE_CSP,
  EXTENSION_PERMISSIONS,
} from './src/extension/manifestPolicy'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Cifras Scroll',
    description: 'Controle o scroll da aba atual com movimentos da cabeça processados localmente.',
    version: '0.2.0',
    minimum_chrome_version: '116',
    permissions: [...EXTENSION_PERMISSIONS],
    host_permissions: [...EXTENSION_HOST_PERMISSIONS],
    action: {
      default_title: 'Cifras Scroll',
    },
    content_security_policy: {
      extension_pages: EXTENSION_PAGE_CSP,
    },
  },
})
