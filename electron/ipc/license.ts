import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { validateLicenseKey } from '../license/validator'
import { getMachineFingerprint } from '../license/fingerprint'
import type { LicenseStatus, ActivateResult } from '@shared/types'

export function registerLicenseHandlers(): void {
  ipcMain.handle('license:getStatus', (): LicenseStatus => {
    const db = getDb()
    const row = db
      .prepare(
        'SELECT id, licensee, email, expires_at, machine_id FROM license_activations ORDER BY id DESC LIMIT 1'
      )
      .get() as {
        id: number
        licensee: string
        email: string | null
        expires_at: string | null
        machine_id: string | null
      } | undefined

    if (!row) return { activated: false }

    const currentFingerprint = getMachineFingerprint()

    if (row.machine_id && row.machine_id !== currentFingerprint) {
      return {
        activated: false,
        error: 'This license is activated on another device. Contact support to transfer your license.',
      }
    }

    // Back-fill machine_id for activations that pre-date migration 005
    if (!row.machine_id) {
      db.prepare('UPDATE license_activations SET machine_id = ? WHERE id = ?')
        .run(currentFingerprint, row.id)
    }

    return {
      activated: true,
      licensee: row.licensee,
      email: row.email,
      expiresAt: row.expires_at,
    }
  })

  ipcMain.handle('license:activate', (_event, key: unknown): ActivateResult => {
    if (typeof key !== 'string' || key.length === 0) {
      return { success: false, error: 'License key is required' }
    }

    const result = validateLicenseKey(key)
    if (!result.valid || !result.payload) {
      return { success: false, error: result.error ?? 'Invalid license key' }
    }

    const db = getDb()

    // Check whether this key is already activated on a different machine
    const existing = db
      .prepare('SELECT machine_id FROM license_activations WHERE license_key = ?')
      .get(key.trim()) as { machine_id: string | null } | undefined

    if (existing) {
      const fp = getMachineFingerprint()
      if (existing.machine_id && existing.machine_id !== fp) {
        return { success: false, error: 'This license key is already activated on another device.' }
      }
      // Same machine re-activating — treat as success without a duplicate insert
      return { success: true, licensee: result.payload.licensee }
    }

    try {
      db.prepare(
        `INSERT OR IGNORE INTO license_activations (license_key, licensee, email, issued_at, expires_at, machine_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        key.trim(),
        result.payload.licensee,
        result.payload.email,
        result.payload.issuedAt,
        result.payload.expiresAt,
        getMachineFingerprint()
      )
    } catch {
      return { success: false, error: 'Failed to save activation' }
    }

    return { success: true, licensee: result.payload.licensee }
  })
}
