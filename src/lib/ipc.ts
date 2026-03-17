import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  ToothChartEntry,
  SetToothConditionRequest,
  Treatment,
  AddTreatmentRequest,
} from '@shared/types'

// Patient operations
export const listPatients = (): Promise<Patient[]> =>
  window.electron.listPatients()

export const createPatient = (data: CreatePatientRequest): Promise<Patient> =>
  window.electron.createPatient(data)

export const updatePatient = (id: number, data: UpdatePatientRequest): Promise<Patient> =>
  window.electron.updatePatient(id, data)

export const archivePatient = (id: number): Promise<void> =>
  window.electron.archivePatient(id)

// Chart operations
export const getChartForPatient = (patientId: number): Promise<ToothChartEntry[]> =>
  window.electron.getChartForPatient(patientId)

export const setToothCondition = (data: SetToothConditionRequest): Promise<void> =>
  window.electron.setToothCondition(data)

// Treatment operations
export const listTreatmentsForTooth = (
  patientId: number,
  toothFdi: number
): Promise<Treatment[]> => window.electron.listTreatmentsForTooth(patientId, toothFdi)

export const listTreatmentsForPatient = (patientId: number): Promise<Treatment[]> =>
  window.electron.listTreatmentsForPatient(patientId)

export const addTreatment = (data: AddTreatmentRequest): Promise<Treatment> =>
  window.electron.addTreatment(data)
