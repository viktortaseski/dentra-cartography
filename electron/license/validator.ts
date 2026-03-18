import crypto from 'crypto'

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQPnKyrPERw3p2ZpUpak9CX42nG6+Q7Ga1xEcdopmnBk=
-----END PUBLIC KEY-----`

export interface LicensePayload {
  licensee: string
  email: string | null
  issuedAt: string
  expiresAt: string | null
  productId: string
  machineCode?: string
}

export interface ValidationResult {
  valid: boolean
  payload?: LicensePayload
  error?: string
}

export function validateLicenseKey(key: string): ValidationResult {
  try {
    const trimmed = key.trim()
    const dotIndex = trimmed.lastIndexOf('.')
    if (dotIndex === -1) return { valid: false, error: 'Invalid key format' }

    const payloadB64 = trimmed.slice(0, dotIndex)
    const sigB64 = trimmed.slice(dotIndex + 1)

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const signature = Buffer.from(sigB64, 'base64url')

    let payload: LicensePayload
    try {
      payload = JSON.parse(payloadJson) as LicensePayload
    } catch {
      return { valid: false, error: 'Invalid key format' }
    }

    if (payload.productId !== 'dental-cartography') {
      return { valid: false, error: 'Invalid product' }
    }

    if (typeof payload.licensee !== 'string' || payload.licensee.trim().length === 0) {
      return { valid: false, error: 'Invalid license payload' }
    }

    if (payload.email !== null && typeof payload.email !== 'string') {
      return { valid: false, error: 'Invalid license payload' }
    }

    if (typeof payload.issuedAt !== 'string' || payload.issuedAt.length === 0) {
      return { valid: false, error: 'Invalid license payload' }
    }

    if (payload.expiresAt !== null && typeof payload.expiresAt !== 'string') {
      return { valid: false, error: 'Invalid license payload' }
    }

    if (payload.machineCode !== undefined && typeof payload.machineCode !== 'string') {
      return { valid: false, error: 'Invalid license payload' }
    }

    if (payload.expiresAt !== null && new Date(payload.expiresAt) < new Date()) {
      return { valid: false, error: 'License has expired' }
    }

    const isValid = crypto.verify(
      null,
      Buffer.from(payloadJson),
      { key: PUBLIC_KEY_PEM, format: 'pem', type: 'spki' },
      signature
    )

    if (!isValid) return { valid: false, error: 'Invalid license signature' }

    return { valid: true, payload }
  } catch {
    return { valid: false, error: 'Invalid key format' }
  }
}
