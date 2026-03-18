import { getDb } from '../db/connection'
import { getMachineFingerprint } from './fingerprint'
import { validateLicenseKey } from './validator'
import type { ActivateResult, LicenseMachineCode, LicenseStatus } from '@shared/types'

interface ActivationRow {
  id: number
  license_key: string
  machine_id: string | null
}

function getLatestActivation(): ActivationRow | undefined {
  const db = getDb()
  return db
    .prepare('SELECT id, license_key, machine_id FROM license_activations ORDER BY id DESC LIMIT 1')
    .get() as ActivationRow | undefined
}

function syncStoredMachineId(id: number, machineId: string): void {
  getDb()
    .prepare('UPDATE license_activations SET machine_id = ? WHERE id = ?')
    .run(machineId, id)
}

function resolveBoundMachineId(row: ActivationRow, currentMachineId: string): string | null {
  const validation = validateLicenseKey(row.license_key)
  if (!validation.valid || !validation.payload) return null

  const boundMachineId = validation.payload.machineCode ?? row.machine_id
  if (!boundMachineId) return null

  if (boundMachineId === currentMachineId && row.machine_id !== boundMachineId) {
    syncStoredMachineId(row.id, boundMachineId)
  }

  return boundMachineId
}

export function getMachineCode(): LicenseMachineCode {
  return { machineCode: getMachineFingerprint() }
}

export function getLicenseStatus(): LicenseStatus {
  const row = getLatestActivation()
  if (!row) return { activated: false }

  const validation = validateLicenseKey(row.license_key)
  if (!validation.valid || !validation.payload) {
    return { activated: false, error: validation.error ?? 'Stored license is invalid' }
  }

  const currentMachineId = getMachineFingerprint()
  const boundMachineId = resolveBoundMachineId(row, currentMachineId)

  if (!boundMachineId) {
    return {
      activated: false,
      error: 'This license must be reissued for this device. Generate a machine code and request a new key.',
    }
  }

  if (boundMachineId !== currentMachineId) {
    return {
      activated: false,
      error: 'This license is activated on another device. Contact support to transfer your license.',
    }
  }

  return {
    activated: true,
    licensee: validation.payload.licensee,
    email: validation.payload.email,
    expiresAt: validation.payload.expiresAt,
  }
}

export function activateLicense(key: unknown): ActivateResult {
  if (typeof key !== 'string' || key.trim().length === 0) {
    return { success: false, error: 'License key is required' }
  }

  const trimmedKey = key.trim()
  const validation = validateLicenseKey(trimmedKey)
  if (!validation.valid || !validation.payload) {
    return { success: false, error: validation.error ?? 'Invalid license key' }
  }

  const currentMachineId = getMachineFingerprint()
  if (!validation.payload.machineCode) {
    return {
      success: false,
      error: 'This key is not machine-bound. Send this device machine code to support and request a new key.',
    }
  }

  if (validation.payload.machineCode !== currentMachineId) {
    return {
      success: false,
      error: 'This license key was issued for another device. Request a key for this machine code.',
    }
  }

  const db = getDb()
  const existing = db
    .prepare('SELECT id, license_key, machine_id FROM license_activations WHERE license_key = ?')
    .get(trimmedKey) as ActivationRow | undefined

  if (existing) {
    const boundMachineId = resolveBoundMachineId(existing, currentMachineId)
    if (!boundMachineId || boundMachineId !== currentMachineId) {
      return {
        success: false,
        error: 'This license key is already activated on another device.',
      }
    }

    return { success: true, licensee: validation.payload.licensee }
  }

  try {
    db.prepare(
      `INSERT INTO license_activations (license_key, licensee, email, issued_at, expires_at, machine_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      trimmedKey,
      validation.payload.licensee,
      validation.payload.email,
      validation.payload.issuedAt,
      validation.payload.expiresAt,
      validation.payload.machineCode
    )
  } catch {
    return { success: false, error: 'Failed to save activation' }
  }

  return { success: true, licensee: validation.payload.licensee }
}
