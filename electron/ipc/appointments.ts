import { ipcMain } from 'electron'
import {
  listAppointments,
  listAppointmentsForPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from '../models/appointment'
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentRequest
} from '@shared/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const VALID_STATUSES = new Set<AppointmentStatus>([
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
])

function validateDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new Error(`Invalid appointment: "${field}" must be a YYYY-MM-DD string`)
  }
  return value
}

function validateTime(value: unknown, field: string): string {
  if (typeof value !== 'string' || !TIME_RE.test(value)) {
    throw new Error(`Invalid appointment: "${field}" must be a HH:MM string`)
  }
  return value
}

function validatePositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid appointment: "${field}" must be a positive integer`)
  }
  return value
}

function validateStatus(value: unknown): AppointmentStatus {
  if (typeof value !== 'string' || !VALID_STATUSES.has(value as AppointmentStatus)) {
    throw new Error(
      `Invalid appointment: "status" must be one of ${[...VALID_STATUSES].join(', ')}`
    )
  }
  return value as AppointmentStatus
}

function validateCreateRequest(data: unknown): CreateAppointmentRequest {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid appointment: expected a non-array object')
  }
  const d = data as Record<string, unknown>

  const patientId = validatePositiveInt(d.patientId, 'patientId')

  if (typeof d.title !== 'string' || d.title.trim().length === 0) {
    throw new Error('Invalid appointment: "title" must be a non-empty string')
  }
  const title = d.title.trim()

  const date      = validateDate(d.date, 'date')
  const startTime = validateTime(d.startTime, 'startTime')
  const endTime   = validateTime(d.endTime, 'endTime')

  if (endTime <= startTime) {
    throw new Error('Invalid appointment: "endTime" must be after "startTime"')
  }

  const status = validateStatus(d.status)

  const notes =
    d.notes === null || d.notes === undefined
      ? null
      : typeof d.notes === 'string'
        ? d.notes
        : (() => { throw new Error('Invalid appointment: "notes" must be a string or null') })()

  return { patientId, title, date, startTime, endTime, status, notes }
}

function validateUpdateRequest(data: unknown): UpdateAppointmentRequest {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid appointment update: expected a non-array object')
  }
  const d = data as Record<string, unknown>
  const validated: UpdateAppointmentRequest = {}

  if ('patientId' in d) {
    validated.patientId = validatePositiveInt(d.patientId, 'patientId')
  }
  if ('title' in d) {
    if (typeof d.title !== 'string' || d.title.trim().length === 0) {
      throw new Error('Invalid appointment update: "title" must be a non-empty string')
    }
    validated.title = d.title.trim()
  }
  if ('date' in d) {
    validated.date = validateDate(d.date, 'date')
  }
  if ('startTime' in d) {
    validated.startTime = validateTime(d.startTime, 'startTime')
  }
  if ('endTime' in d) {
    validated.endTime = validateTime(d.endTime, 'endTime')
  }
  // Cross-field check: if both times are present after merging, endTime must be after startTime.
  // We only have access to what was submitted, so we validate when both are present.
  if (validated.startTime !== undefined && validated.endTime !== undefined) {
    if (validated.endTime <= validated.startTime) {
      throw new Error('Invalid appointment update: "endTime" must be after "startTime"')
    }
  }
  if ('status' in d) {
    validated.status = validateStatus(d.status)
  }
  if ('notes' in d) {
    if (d.notes !== null && typeof d.notes !== 'string') {
      throw new Error('Invalid appointment update: "notes" must be a string or null')
    }
    validated.notes = d.notes as string | null
  }

  return validated
}

export function registerAppointmentHandlers(): void {
  ipcMain.handle('appointments:list', (_event, date: unknown): Appointment[] => {
    if (date !== undefined && date !== null) {
      const validated = validateDate(date, 'date')
      return listAppointments(validated)
    }
    return listAppointments()
  })

  ipcMain.handle(
    'appointments:listForPatient',
    (_event, patientId: unknown): Appointment[] => {
      return listAppointmentsForPatient(validatePositiveInt(patientId, 'patientId'))
    }
  )

  ipcMain.handle('appointments:create', (_event, data: unknown): Appointment => {
    return createAppointment(validateCreateRequest(data))
  })

  ipcMain.handle(
    'appointments:update',
    (_event, id: unknown, data: unknown): Appointment => {
      const validId = validatePositiveInt(id, 'id')
      const validData = validateUpdateRequest(data)
      const result = updateAppointment(validId, validData)
      if (!result) {
        throw new Error(`Appointment with id ${validId} not found`)
      }
      return result
    }
  )

  ipcMain.handle('appointments:delete', (_event, id: unknown): void => {
    const validId = validatePositiveInt(id, 'id')
    const deleted = deleteAppointment(validId)
    if (!deleted) {
      throw new Error(`Appointment with id ${validId} not found`)
    }
  })
}
