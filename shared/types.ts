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
  price: number | null
  createdAt: string
}

export type AddTreatmentRequest = Omit<Treatment, 'id' | 'createdAt'>

// ── Clinic Settings ──────────────────────────────────────────────────────────

export interface ClinicSettings {
  clinicName: string
  clinicAddress: string
  clinicPhone: string
  clinicEmail: string
  clinicWebsite: string
  dentistName: string
}

// ── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: number
  patientId: number
  title: string
  date: string         // YYYY-MM-DD
  startTime: string    // HH:MM
  endTime: string      // HH:MM
  status: AppointmentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CreateAppointmentRequest = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>

// ── License ───────────────────────────────────────────────────────────────────

export interface LicenseStatus {
  activated: boolean
  licensee?: string
  email?: string | null
  expiresAt?: string | null
}

export interface ActivateResult {
  success: boolean
  licensee?: string
  error?: string
}

// ── Auto-update ───────────────────────────────────────────────────────────────

export type UpdateStatus =
  | { kind: 'checking' }
  | { kind: 'available'; version: string }
  | { kind: 'not-available' }
  | { kind: 'downloading'; percent: number }
  | { kind: 'downloaded'; version: string }
  | { kind: 'error'; message: string }

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

  // Clinic settings
  getClinicSettings: () => Promise<ClinicSettings>
  updateClinicSettings: (data: Partial<ClinicSettings>) => Promise<ClinicSettings>

  // Appointments
  listAppointments: (date?: string) => Promise<Appointment[]>
  listAppointmentsForPatient: (patientId: number) => Promise<Appointment[]>
  createAppointment: (data: CreateAppointmentRequest) => Promise<Appointment>
  updateAppointment: (id: number, data: UpdateAppointmentRequest) => Promise<Appointment>
  deleteAppointment: (id: number) => Promise<void>

  // Auto-update
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
  quitAndInstall: () => Promise<void>

  // License
  getLicenseStatus: () => Promise<LicenseStatus>
  activateLicense: (key: string) => Promise<ActivateResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
