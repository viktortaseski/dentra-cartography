import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { listPatients, getPatient, createPatient, updatePatient, archivePatient } from '../models/patient'
import type { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types'

const VALID_SEX = new Set<string>(['male', 'female', 'other'])

function validateCreateRequest(data: unknown): CreatePatientRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid patient data: expected an object')
  }
  const d = data as Record<string, unknown>

  if (typeof d.fullName !== 'string' || d.fullName.trim().length === 0) {
    throw new Error('Invalid patient data: fullName must be a non-empty string')
  }
  if (typeof d.dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth)) {
    throw new Error('Invalid patient data: dateOfBirth must be a YYYY-MM-DD string')
  }
  if (typeof d.sex !== 'string' || !VALID_SEX.has(d.sex)) {
    throw new Error('Invalid patient data: sex must be "male", "female", or "other"')
  }

  return {
    fullName: d.fullName.trim(),
    dateOfBirth: d.dateOfBirth,
    sex: d.sex as CreatePatientRequest['sex'],
    phone: typeof d.phone === 'string' ? d.phone : null,
    email: typeof d.email === 'string' ? d.email : null,
    address: typeof d.address === 'string' ? d.address : null,
    insuranceProvider: typeof d.insuranceProvider === 'string' ? d.insuranceProvider : null,
    insurancePolicy: typeof d.insurancePolicy === 'string' ? d.insurancePolicy : null,
    medicalAlerts: typeof d.medicalAlerts === 'string' ? d.medicalAlerts : null,
    notes: typeof d.notes === 'string' ? d.notes : null
  }
}

function validateUpdateRequest(data: unknown): UpdatePatientRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid update data: expected an object')
  }
  const d = data as Record<string, unknown>
  const result: UpdatePatientRequest = {}

  if (d.fullName !== undefined) {
    if (typeof d.fullName !== 'string' || d.fullName.trim().length === 0) {
      throw new Error('Invalid update data: fullName must be a non-empty string')
    }
    result.fullName = d.fullName.trim()
  }
  if (d.dateOfBirth !== undefined) {
    if (typeof d.dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth)) {
      throw new Error('Invalid update data: dateOfBirth must be a YYYY-MM-DD string')
    }
    result.dateOfBirth = d.dateOfBirth
  }
  if (d.sex !== undefined) {
    if (typeof d.sex !== 'string' || !VALID_SEX.has(d.sex)) {
      throw new Error('Invalid update data: sex must be "male", "female", or "other"')
    }
    result.sex = d.sex as UpdatePatientRequest['sex']
  }
  if (d.phone !== undefined) result.phone = typeof d.phone === 'string' ? d.phone : null
  if (d.email !== undefined) result.email = typeof d.email === 'string' ? d.email : null
  if (d.address !== undefined) result.address = typeof d.address === 'string' ? d.address : null
  if (d.insuranceProvider !== undefined)
    result.insuranceProvider =
      typeof d.insuranceProvider === 'string' ? d.insuranceProvider : null
  if (d.insurancePolicy !== undefined)
    result.insurancePolicy = typeof d.insurancePolicy === 'string' ? d.insurancePolicy : null
  if (d.medicalAlerts !== undefined)
    result.medicalAlerts = typeof d.medicalAlerts === 'string' ? d.medicalAlerts : null
  if (d.notes !== undefined) result.notes = typeof d.notes === 'string' ? d.notes : null

  return result
}

function validateId(id: unknown): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid id: must be a positive integer')
  }
  return id
}

export function registerPatientHandlers(): void {
  ipcMain.handle('patients:list', (): Patient[] => {
    return listPatients(getDb())
  })

  ipcMain.handle('patients:get', (_event, id: unknown): Patient | undefined => {
    return getPatient(getDb(), validateId(id))
  })

  ipcMain.handle('patients:create', (_event, data: unknown): Patient => {
    return createPatient(getDb(), validateCreateRequest(data))
  })

  ipcMain.handle('patients:update', (_event, id: unknown, data: unknown): Patient | undefined => {
    return updatePatient(getDb(), validateId(id), validateUpdateRequest(data))
  })

  ipcMain.handle('patients:archive', (_event, id: unknown): void => {
    archivePatient(getDb(), validateId(id))
  })
}
