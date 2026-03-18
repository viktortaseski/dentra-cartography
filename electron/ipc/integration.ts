import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import type { IntegrationConfig, SyncResult } from '@shared/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSetting(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM integration_settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row ? row.value : null
}

function upsertSetting(key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO integration_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value)
}

function readConfig(): {
  apiUrl: string
  clinicName: string
  username: string
  password: string
} | null {
  const apiUrl = getSetting('api_url')
  const clinicName = getSetting('clinic_name')
  const username = getSetting('username')
  const password = getSetting('password')

  if (!apiUrl || !clinicName || !username || !password) {
    return null
  }

  return { apiUrl, clinicName, username, password }
}

interface RemoteAppointment {
  id: string
  patient_name: string
  patient_email: string | null
  patient_phone: string | null
  date: string
  time: string
  notes: string | null
  completed: boolean
  doctor_name: string | null
}

function addMinutesToTime(hhmm: string, minutes: number): string {
  const [hourStr, minuteStr] = hhmm.split(':')
  const totalMinutes = Number(hourStr) * 60 + Number(minuteStr) + minutes
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Try to match an online booking to an existing local patient by:
 *   1. Exact full_name match
 *   2. Email match (if provided)
 *   3. Phone match (if provided)
 * Returns the patient id if found, otherwise null — no placeholder is created.
 */
function findPatientId(
  fullName: string,
  email: string | null,
  phone: string | null
): number | null {
  const db = getDb()

  const byName = db
    .prepare(`SELECT id FROM patients WHERE full_name = ? AND archived_at IS NULL LIMIT 1`)
    .get(fullName) as { id: number } | undefined
  if (byName) return byName.id

  if (email) {
    const byEmail = db
      .prepare(`SELECT id FROM patients WHERE email = ? AND archived_at IS NULL LIMIT 1`)
      .get(email) as { id: number } | undefined
    if (byEmail) return byEmail.id
  }

  if (phone) {
    const byPhone = db
      .prepare(`SELECT id FROM patients WHERE phone = ? AND archived_at IS NULL LIMIT 1`)
      .get(phone) as { id: number } | undefined
    if (byPhone) return byPhone.id
  }

  return null
}

// ── Token cache (avoids re-authenticating on every sync) ──────────────────────

interface TokenCache {
  token: string
  expiresAt: number // ms timestamp
}

let tokenCache: TokenCache | null = null

async function getToken(config: {
  apiUrl: string
  clinicName: string
  username: string
  password: string
}): Promise<string> {
  const now = Date.now()

  // Reuse cached token if still valid (with 5-min buffer before expiry)
  if (tokenCache && tokenCache.expiresAt - now > 5 * 60 * 1000) {
    return tokenCache.token
  }

  const loginResponse = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinicName: config.clinicName,
      username: config.username,
      password: config.password,
    }),
  })

  if (!loginResponse.ok) {
    const body = await loginResponse.text()
    throw new Error(`Authentication failed: ${loginResponse.status} ${body}`)
  }

  let token: string | null = null

  const setCookie = loginResponse.headers.get('set-cookie')
  if (setCookie) {
    const match = setCookie.match(/admin_session=([^;]+)/)
    if (match) token = match[1]
  }

  if (!token) {
    try {
      const body = (await loginResponse.json()) as Record<string, unknown>
      if (typeof body.token === 'string') token = body.token
      else if (typeof body.accessToken === 'string') token = body.accessToken
    } catch { /* not JSON */ }
  }

  if (!token) throw new Error('Could not extract authentication token from login response')

  // Cache for 7.5 hours (JWT expires in 8h)
  tokenCache = { token, expiresAt: now + 7.5 * 60 * 60 * 1000 }
  return token
}

// ── Handler registration ──────────────────────────────────────────────────────

export function registerIntegrationHandlers(): void {
  // ── integration:getConfig ────────────────────────────────────────────────

  ipcMain.handle('integration:getConfig', (): IntegrationConfig => {
    return {
      apiUrl: getSetting('api_url') ?? '',
      clinicName: getSetting('clinic_name') ?? '',
      username: getSetting('username') ?? '',
    }
  })

  // ── integration:saveConfig ───────────────────────────────────────────────

  ipcMain.handle(
    'integration:saveConfig',
    (
      _event,
      data: unknown
    ): void => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid integration config: expected a non-array object')
      }
      const d = data as Record<string, unknown>

      const fields: Array<[string, string]> = [
        ['apiUrl', 'api_url'],
        ['clinicName', 'clinic_name'],
        ['username', 'username'],
        ['password', 'password'],
      ]

      for (const [jsKey, dbKey] of fields) {
        if (typeof d[jsKey] !== 'string') {
          throw new Error(
            `Invalid integration config: field "${jsKey}" must be a string`
          )
        }
        upsertSetting(dbKey, d[jsKey] as string)
      }
    }
  )

  // ── integration:testConnection ───────────────────────────────────────────

  ipcMain.handle(
    'integration:testConnection',
    async (): Promise<{ success: boolean; error?: string }> => {
      const config = readConfig()
      if (!config) {
        return { success: false, error: 'Connection not configured' }
      }

      try {
        await getToken(config)
        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { success: false, error: message }
      }
    }
  )

  // ── integration:sync ─────────────────────────────────────────────────────

  ipcMain.handle('integration:sync', async (): Promise<SyncResult> => {
    const config = readConfig()
    if (!config) {
      return { synced: 0, errors: ['Not configured'] }
    }

    // 1. Authenticate
    let token: string | null = null
    try {
      const loginResponse = await fetch(`${config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: config.clinicName,
          username: config.username,
          password: config.password,
        }),
      })

      if (!loginResponse.ok) {
        return {
          synced: 0,
          errors: [`Authentication failed: ${loginResponse.statusText}`],
        }
      }

      // Try to extract JWT from Set-Cookie header first
      const setCookie = loginResponse.headers.get('set-cookie')
      if (setCookie) {
        const match = setCookie.match(/admin_session=([^;]+)/)
        if (match) {
          token = match[1]
        }
      }

      // Fall back to response body
      if (!token) {
        try {
          const body = (await loginResponse.json()) as Record<string, unknown>
          if (typeof body.token === 'string') {
            token = body.token
          } else if (typeof body.accessToken === 'string') {
            token = body.accessToken
          }
        } catch {
          // body was not JSON
        }
      }

      if (!token) {
        return { synced: 0, errors: ['Could not extract authentication token from login response'] }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { synced: 0, errors: [`Authentication error: ${message}`] }
    }

    // 2. Fetch remote appointments
    let remoteAppointments: RemoteAppointment[]
    try {
      const apptResponse = await fetch(`${config.apiUrl}/api/appointments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `admin_session=${token}`,
        },
      })

      if (!apptResponse.ok) {
        return {
          synced: 0,
          errors: [`Failed to fetch appointments: ${apptResponse.statusText}`],
        }
      }

      const apptBody = (await apptResponse.json()) as { appointments?: RemoteAppointment[] } | RemoteAppointment[]
      remoteAppointments = Array.isArray(apptBody) ? apptBody : (apptBody.appointments ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { synced: 0, errors: [`Fetch error: ${message}`] }
    }

    // 3. Upsert each remote appointment
    const db = getDb()
    const findStmt = db.prepare(
      `SELECT id FROM appointments WHERE external_id = ? LIMIT 1`
    )
    const insertStmt = db.prepare(`
      INSERT INTO appointments
        (external_id, source, patient_id, patient_name, title, date, start_time, end_time, status, notes)
      VALUES (?, 'external', ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const updateStmt = db.prepare(`
      UPDATE appointments SET
        patient_id   = ?,
        patient_name = ?,
        title        = ?,
        date         = ?,
        start_time   = ?,
        end_time     = ?,
        status       = ?,
        notes        = ?,
        updated_at   = datetime('now')
      WHERE external_id = ?
    `)

    let synced = 0
    const errors: string[] = []

    for (const remote of remoteAppointments) {
      try {
        if (
          typeof remote.id !== 'string' ||
          typeof remote.patient_name !== 'string' ||
          typeof remote.date !== 'string' ||
          typeof remote.time !== 'string'
        ) {
          errors.push(`Skipping malformed remote appointment: ${JSON.stringify(remote)}`)
          continue
        }

        const patientId = findPatientId(remote.patient_name, remote.patient_email ?? null, remote.patient_phone ?? null)
        const title = 'Check-up'
        const startTime = remote.time.slice(0, 5)
        const endTime = addMinutesToTime(startTime, 30)
        const status = remote.completed ? 'completed' : 'scheduled'
        const onlineNote = remote.doctor_name
          ? `Scheduled online — Dr. ${remote.doctor_name}`
          : 'Scheduled online'
        const notes = remote.notes
          ? `${remote.notes}\n${onlineNote}`
          : onlineNote

        const existing = findStmt.get(remote.id) as { id: number } | undefined
        if (existing) {
          updateStmt.run(
            patientId,
            remote.patient_name,
            title,
            remote.date,
            startTime,
            endTime,
            status,
            notes,
            remote.id
          )
        } else {
          insertStmt.run(
            remote.id,
            patientId,
            remote.patient_name,
            title,
            remote.date,
            startTime,
            endTime,
            status,
            notes
          )
        }

        synced++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Error syncing appointment ${remote.id}: ${message}`)
      }
    }

    return { synced, errors }
  })
}
