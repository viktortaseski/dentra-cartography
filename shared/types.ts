// ── Patients ────────────────────────────────────────────────────────────────

export interface Patient {
  id: number
  fullName: string
  dateOfBirth: string // ISO date string YYYY-MM-DD
  sex: 'male' | 'female' | 'other'
  phone: string | null
  email: string | null
  address: string | null
  insuranceProvider: string | null
  insurancePolicy: string | null
  medicalAlerts: string | null
  notes: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePatientRequest = Omit<Patient, 'id' | 'archivedAt' | 'createdAt' | 'updatedAt'>
export type UpdatePatientRequest = Partial<CreatePatientRequest>

// ── Teeth ────────────────────────────────────────────────────────────────────

export type ToothSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual' | 'incisal'

export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'filling_amalgam'
  | 'filling_composite'
  | 'crown'
  | 'extraction'
  | 'missing_congenital'
  | 'implant'
  | 'root_canal'
  | 'bridge_pontic'
  | 'fracture'
  | 'watch'

export interface SurfaceCondition {
  surface: ToothSurface
  condition: ToothCondition
}

export interface ToothChartEntry {
  toothFdi: number
  surfaces: SurfaceCondition[]
}

export interface SetToothConditionRequest {
  patientId: number
  toothFdi: number
  surface: ToothSurface
  condition: ToothCondition
}

// ── Treatments ───────────────────────────────────────────────────────────────

export type TreatmentStatus = 'planned' | 'completed' | 'referred'

export interface Treatment {
  id: number
  patientId: number
  toothFdi: number
  surface: ToothSurface | null
  conditionType: ToothCondition
  status: TreatmentStatus
  datePerformed: string // ISO date YYYY-MM-DD
  performedBy: string | null
  notes: string | null
  createdAt: string
}

export type AddTreatmentRequest = Omit<Treatment, 'id' | 'createdAt'>

// ── IPC Bridge ───────────────────────────────────────────────────────────────

export interface ElectronAPI {
  listPatients: () => Promise<Patient[]>
  getPatient: (id: number) => Promise<Patient | undefined>
  createPatient: (data: CreatePatientRequest) => Promise<Patient>
  updatePatient: (id: number, data: UpdatePatientRequest) => Promise<Patient>
  archivePatient: (id: number) => Promise<void>

  getChartForPatient: (patientId: number) => Promise<ToothChartEntry[]>
  setToothCondition: (data: SetToothConditionRequest) => Promise<void>

  listTreatmentsForTooth: (patientId: number, toothFdi: number) => Promise<Treatment[]>
  listTreatmentsForPatient: (patientId: number) => Promise<Treatment[]>
  addTreatment: (data: AddTreatmentRequest) => Promise<Treatment>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
