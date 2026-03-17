import { ipcMain } from 'electron'
import { getClinicSettings, updateClinicSettings } from '../models/clinicSettings'
import type { ClinicSettings } from '@shared/types'

const VALID_SETTINGS_KEYS = new Set<keyof ClinicSettings>([
  'clinicName',
  'clinicAddress',
  'clinicPhone',
  'clinicEmail',
  'clinicWebsite',
  'dentistName'
])

function validatePartialClinicSettings(data: unknown): Partial<ClinicSettings> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid clinic settings: expected a non-array object')
  }
  const d = data as Record<string, unknown>
  const validated: Partial<ClinicSettings> = {}

  for (const key of VALID_SETTINGS_KEYS) {
    if (!(key in d)) continue
    const val = d[key]
    if (typeof val !== 'string') {
      throw new Error(`Invalid clinic settings: field "${key}" must be a string`)
    }
    validated[key] = val
  }

  return validated
}

export function registerClinicSettingsHandlers(): void {
  ipcMain.handle('clinic:getSettings', (): ClinicSettings => {
    return getClinicSettings()
  })

  ipcMain.handle('clinic:updateSettings', (_event, data: unknown): ClinicSettings => {
    const validated = validatePartialClinicSettings(data)
    return updateClinicSettings(validated)
  })
}
