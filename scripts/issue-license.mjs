// Usage: node scripts/issue-license.mjs "Dr. Jane Smith" "jane@clinic.com" [YYYY-MM-DD expiry]
import { sign } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const privateKey = readFileSync(join(__dirname, '..', 'keys', 'private.pem'), 'utf8')

const licensee = process.argv[2]
const email = process.argv[3] ?? null
const expiresAt = process.argv[4] ?? null

if (!licensee) {
  console.error('Usage: node scripts/issue-license.mjs "Dr. Name" "email@clinic.com" [YYYY-MM-DD]')
  process.exit(1)
}

const payload = {
  licensee,
  email,
  issuedAt: new Date().toISOString().split('T')[0],
  expiresAt,
  productId: 'dental-cartography',
}

const payloadJson = JSON.stringify(payload)
const signature = sign(null, Buffer.from(payloadJson), privateKey)
const licenseKey = `${Buffer.from(payloadJson).toString('base64url')}.${signature.toString('base64url')}`

console.log('\nLicense key for:', licensee)
console.log('\n' + licenseKey + '\n')
