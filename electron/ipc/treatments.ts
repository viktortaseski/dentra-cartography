import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { listTreatmentsForPatient, listTreatmentsForTooth, addTreatment } from '../models/treatment'
import type {
  Treatment,
  AddTreatmentRequest,
  ToothSurface,
  ToothCondition,
  TreatmentStatus
} from '@shared/types'

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

const VALID_STATUSES = new Set<string>(['planned', 'completed', 'referred'])

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

function validateToothFdi(fdi: unknown): number {
  if (typeof fdi !== 'number' || !Number.isInteger(fdi) || !isValidFdiNumber(fdi)) {
    throw new Error('Invalid toothFdi: must be a valid FDI tooth number')
  }
  return fdi
}

function validateAddTreatmentRequest(data: unknown): AddTreatmentRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid treatment data: expected an object')
  }
  const d = data as Record<string, unknown>

  if (typeof d.patientId !== 'number' || !Number.isInteger(d.patientId) || d.patientId <= 0) {
    throw new Error('Invalid treatment data: patientId must be a positive integer')
  }
  if (typeof d.toothFdi !== 'number' || !Number.isInteger(d.toothFdi) || !isValidFdiNumber(d.toothFdi)) {
    throw new Error('Invalid treatment data: toothFdi must be a valid FDI tooth number')
  }
  if (d.surface !== null && d.surface !== undefined) {
    if (typeof d.surface !== 'string' || !VALID_SURFACES.has(d.surface)) {
      throw new Error(
        `Invalid treatment data: surface must be null or one of ${[...VALID_SURFACES].join(', ')}`
      )
    }
  }
  if (typeof d.conditionType !== 'string' || !VALID_CONDITIONS.has(d.conditionType)) {
    throw new Error(
      `Invalid treatment data: conditionType must be one of ${[...VALID_CONDITIONS].join(', ')}`
    )
  }
  if (typeof d.status !== 'string' || !VALID_STATUSES.has(d.status)) {
    throw new Error(
      `Invalid treatment data: status must be one of ${[...VALID_STATUSES].join(', ')}`
    )
  }
  if (typeof d.datePerformed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.datePerformed)) {
    throw new Error('Invalid treatment data: datePerformed must be a YYYY-MM-DD string')
  }

  return {
    patientId: d.patientId,
    toothFdi: d.toothFdi,
    surface: (d.surface as ToothSurface) ?? null,
    conditionType: d.conditionType as ToothCondition,
    status: d.status as TreatmentStatus,
    datePerformed: d.datePerformed,
    performedBy: typeof d.performedBy === 'string' ? d.performedBy : null,
    notes: typeof d.notes === 'string' ? d.notes : null
  }
}

export function registerTreatmentHandlers(): void {
  ipcMain.handle(
    'treatments:listForTooth',
    (_event, patientId: unknown, toothFdi: unknown): Treatment[] => {
      return listTreatmentsForTooth(getDb(), validatePatientId(patientId), validateToothFdi(toothFdi))
    }
  )

  ipcMain.handle('treatments:listForPatient', (_event, patientId: unknown): Treatment[] => {
    return listTreatmentsForPatient(getDb(), validatePatientId(patientId))
  })

  ipcMain.handle('treatments:add', (_event, data: unknown): Treatment => {
    return addTreatment(getDb(), validateAddTreatmentRequest(data))
  })
}
