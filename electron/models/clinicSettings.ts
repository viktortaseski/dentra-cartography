import { getDb } from '../db/connection'
import type { ClinicSettings } from '@shared/types'

const KEYS: (keyof ClinicSettings)[] = [
  'clinicName',
  'clinicAddress',
  'clinicPhone',
  'clinicEmail',
  'clinicWebsite',
  'dentistName'
]

// Map camelCase key → snake_case DB key
function toDbKey(key: keyof ClinicSettings): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function getClinicSettings(): ClinicSettings {
  const db = getDb()
  const rows = db
    .prepare('SELECT key, value FROM clinic_settings')
    .all() as { key: string; value: string }[]
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    clinicName:    map['clinic_name']    ?? '',
    clinicAddress: map['clinic_address'] ?? '',
    clinicPhone:   map['clinic_phone']   ?? '',
    clinicEmail:   map['clinic_email']   ?? '',
    clinicWebsite: map['clinic_website'] ?? '',
    dentistName:   map['dentist_name']   ?? ''
  }
}

export function updateClinicSettings(data: Partial<ClinicSettings>): ClinicSettings {
  const db = getDb()
  const update = db.prepare(
    'INSERT OR REPLACE INTO clinic_settings (key, value) VALUES (?, ?)'
  )
  const tx = db.transaction((updates: Partial<ClinicSettings>) => {
    for (const key of KEYS) {
      if (key in updates && updates[key] !== undefined) {
        update.run(toDbKey(key), updates[key])
      }
    }
  })
  tx(data)
  return getClinicSettings()
}
