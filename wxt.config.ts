import { defineConfig } from 'wxt'
import {
  EXTENSION_HOST_PERMISSIONS,
  EXTENSION_PAGE_CSP,
  EXTENSION_PERMISSIONS,
} from './src/extension/manifestPolicy'
import {
  EMERGENCY_STOP_COMMAND,
  EMERGENCY_STOP_DEFAULT_SHORTCUT,
  EMERGENCY_STOP_MAC_SHORTCUT,
} from './src/extension/emergencyStop'

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
    commands: {
      [EMERGENCY_STOP_COMMAND]: {
        suggested_key: {
          default: EMERGENCY_STOP_DEFAULT_SHORTCUT,
          mac: EMERGENCY_STOP_MAC_SHORTCUT,
        },
        description: 'Parar imediatamente o scroll e liberar a câmera',
      },
    },
    content_security_policy: {
      extension_pages: EXTENSION_PAGE_CSP,
    },
  },
})
