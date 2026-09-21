import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const output = resolve(root, '.output', 'chrome-mv3')
const manifestPath = resolve(output, 'manifest.json')
const zipPath = resolve(root, '.output', `${packageJson.name}-${packageJson.version}-chrome.zip`)

assert(existsSync(manifestPath), 'manifest de produção não encontrado')
assert(existsSync(zipPath), 'ZIP de publicação não encontrado')

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
assert(manifest.manifest_version === 3, 'o pacote precisa usar Manifest V3')
assert(manifest.version === packageJson.version, 'a versão do manifest diverge do package.json')
assert(JSON.stringify(manifest.permissions) === JSON.stringify(['activeTab', 'scripting', 'storage', 'offscreen']), 'as permissões do pacote divergiram da política aprovada')
assert(Array.isArray(manifest.host_permissions) && manifest.host_permissions.length === 0, 'o pacote não pode declarar hosts permanentes')
assert(manifest.content_security_policy?.extension_pages?.includes("connect-src 'self'"), 'a CSP precisa restringir conexões à própria extensão')

for (const size of [16, 32, 48, 128]) {
  const icon = manifest.icons?.[String(size)]
  assert(typeof icon === 'string' && existsSync(resolve(output, icon)), `ícone ${size} ausente do pacote`)
}

assert(statSync(zipPath).size < 2_000_000_000, 'o ZIP excede o limite de 2 GB da loja')

console.log(`Release verificada: ${zipPath}`)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

