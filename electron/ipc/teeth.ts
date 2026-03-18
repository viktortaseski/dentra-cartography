import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { getChartForPatient, setToothCondition } from '../models/tooth'
import type { ToothChartEntry, SetToothConditionRequest, ToothSurface, ToothCondition } from '@shared/types'

const VALID_SURFACES = new Set<string>([
  'occlusal',
  'mesial',
  'distal',
  'buccal',
  'lingual',
  'incisal'
])

const VALID_CONDITIONS = new Set<string>([
  'healthy',
  'caries',
  'filling_amalgam',
  'filling_composite',
  'crown',
  'extraction',
  'missing_congenital',
  'implant',
  'root_canal',
  'bridge_pontic',
  'fracture',
  'watch'
])

// FDI tooth numbers: permanent 11-18, 21-28, 31-38, 41-48; primary 51-55, 61-65, 71-75, 81-85
function isValidFdiNumber(n: number): boolean {
  const quadrant = Math.floor(n / 10)
  const position = n % 10
  if (quadrant >= 1 && quadrant <= 4) return position >= 1 && position <= 8
  if (quadrant >= 5 && quadrant <= 8) return position >= 1 && position <= 5
  return false
}

function validatePatientId(id: unknown): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid patientId: must be a positive integer')
  }
  return id
}

function validateSetConditionRequest(data: unknown): SetToothConditionRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid setToothCondition data: expected an object')
  }
  const d = data as Record<string, unknown>

  if (typeof d.patientId !== 'number' || !Number.isInteger(d.patientId) || d.patientId <= 0) {
    throw new Error('Invalid setToothCondition data: patientId must be a positive integer')
  }
  if (typeof d.toothFdi !== 'number' || !Number.isInteger(d.toothFdi) || !isValidFdiNumber(d.toothFdi)) {
    throw new Error('Invalid setToothCondition data: toothFdi must be a valid FDI tooth number')
  }
  if (typeof d.surface !== 'string' || !VALID_SURFACES.has(d.surface)) {
    throw new Error(
      `Invalid setToothCondition data: surface must be one of ${[...VALID_SURFACES].join(', ')}`
    )
  }
  if (typeof d.condition !== 'string' || !VALID_CONDITIONS.has(d.condition)) {
    throw new Error(
      `Invalid setToothCondition data: condition must be one of ${[...VALID_CONDITIONS].join(', ')}`
    )
  }

  return {
    patientId: d.patientId,
    toothFdi: d.toothFdi,
    surface: d.surface as ToothSurface,
    condition: d.condition as ToothCondition
  }
}

function validateToothFdi(toothFdi: unknown): number {
  if (typeof toothFdi !== 'number' || !Number.isInteger(toothFdi) || !isValidFdiNumber(toothFdi)) {
    throw new Error('Invalid toothFdi: must be a valid FDI tooth number')
  }
  return toothFdi
}

function validateNotes(notes: unknown): string {
  if (typeof notes !== 'string') {
    throw new Error('Invalid notes: must be a string')
  }
  return notes.trim()
}

export function registerTeethHandlers(): void {
  ipcMain.handle('teeth:getChart', (_event, patientId: unknown): ToothChartEntry[] => {
    return getChartForPatient(getDb(), validatePatientId(patientId))
  })

  ipcMain.handle('teeth:setCondition', (_event, data: unknown): void => {
    setToothCondition(getDb(), validateSetConditionRequest(data))
  })

  ipcMain.handle('teeth:getToothNote', (_event, patientId: unknown, toothFdi: unknown): string => {
    const pid = validatePatientId(patientId)
    const fdi = validateToothFdi(toothFdi)
    const db = getDb()
    const row = db.prepare(
      'SELECT notes FROM tooth_notes WHERE patient_id = ? AND tooth_fdi = ?'
    ).get(pid, fdi) as { notes: string } | undefined
    return row ? row.notes : ''
  })

  ipcMain.handle(
    'teeth:setToothNote',
    (_event, patientId: unknown, toothFdi: unknown, notes: unknown): string => {
      const pid = validatePatientId(patientId)
      const fdi = validateToothFdi(toothFdi)
      const trimmedNotes = validateNotes(notes)
      const db = getDb()
      db.prepare(
        `INSERT INTO tooth_notes (patient_id, tooth_fdi, notes, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(patient_id, tooth_fdi)
         DO UPDATE SET notes = excluded.notes, updated_at = excluded.updated_at`
      ).run(pid, fdi, trimmedNotes)
      return trimmedNotes
    }
  )
}
