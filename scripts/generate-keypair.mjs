import { generateKeyPairSync } from 'crypto'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keysDir = join(__dirname, '..', 'keys')

mkdirSync(keysDir, { recursive: true })

const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

writeFileSync(join(keysDir, 'private.pem'), privateKey, { mode: 0o600 })
writeFileSync(join(keysDir, 'public.pem'), publicKey)

console.log('Keys generated in ./keys/')
console.log('  private.pem — KEEP SECRET, never commit')
console.log('  public.pem  — embed in electron/license/validator.ts')
console.log('\nPublic key:')
console.log(publicKey)
