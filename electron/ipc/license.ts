import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { validateLicenseKey } from '../license/validator'
import type { LicenseStatus, ActivateResult } from '@shared/types'

export function registerLicenseHandlers(): void {
  ipcMain.handle('license:getStatus', (): LicenseStatus => {
    const db = getDb()
    const row = db
      .prepare(
        'SELECT licensee, email, expires_at FROM license_activations ORDER BY id DESC LIMIT 1'
      )
      .get() as { licensee: string; email: string | null; expires_at: string | null } | undefined

    if (!row) return { activated: false }
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
    try {
      db.prepare(
        `INSERT OR IGNORE INTO license_activations (license_key, licensee, email, issued_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        key.trim(),
        result.payload.licensee,
        result.payload.email,
        result.payload.issuedAt,
        result.payload.expiresAt
      )
    } catch {
      return { success: false, error: 'Failed to save activation' }
    }

    return { success: true, licensee: result.payload.licensee }
  })
}
