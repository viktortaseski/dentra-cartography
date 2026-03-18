// Usage:
// node scripts/issue-license.mjs "Dr. Jane Smith" --machine <machine-code> [--email email@clinic.com] [--expires YYYY-MM-DD]
import { sign } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const privateKey = readFileSync(join(__dirname, '..', 'keys', 'private.pem'), 'utf8')

const args = process.argv.slice(2)
const licensee = args[0]

function readOption(name) {
  const index = args.indexOf(name)
  if (index === -1) return null
  return args[index + 1] ?? null
}

const machineCode = readOption('--machine')
const email = readOption('--email')
const expiresAt = readOption('--expires')

if (!licensee || !machineCode) {
  console.error(
    'Usage: node scripts/issue-license.mjs "Dr. Name" --machine <machine-code> [--email email@clinic.com] [--expires YYYY-MM-DD]'
  )
  process.exit(1)
}

const payload = {
  licensee,
  email,
  issuedAt: new Date().toISOString().split('T')[0],
  expiresAt,
  productId: 'dental-cartography',
  machineCode,
}

const payloadJson = JSON.stringify(payload)
const signature = sign(null, Buffer.from(payloadJson), privateKey)
const licenseKey = `${Buffer.from(payloadJson).toString('base64url')}.${signature.toString('base64url')}`

console.log('\nLicense key for:', licensee)
console.log('Machine code:', machineCode)
console.log('\n' + licenseKey + '\n')
