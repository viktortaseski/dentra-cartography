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

export interface UpdateTreatmentNotesRequest {
  id: number
  notes: string | null
  price: number | null
}

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
  patientId: number | null
  patientName: string | null   // stored from external sync; null for local appointments
  title: string
  date: string         // YYYY-MM-DD
  startTime: string    // HH:MM
  endTime: string      // HH:MM
  status: AppointmentStatus
  notes: string | null
  source?: 'local' | 'external'
  createdAt: string
  updatedAt: string
}

export type CreateAppointmentRequest = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>

// ── Revenue ───────────────────────────────────────────────────────────────────

export interface RevenueTransaction {
  treatmentId: number
  patientId: number
  patientName: string
  conditionType: string
  toothFdi: number
  surface: string | null
  status: string          // 'planned' | 'completed' | 'referred'
  datePerformed: string   // YYYY-MM-DD
  price: number
}

export interface RevenueStats {
  totalEarned: number           // sum of price where status = 'completed'
  totalOutstanding: number      // sum of price where status = 'planned'
  earnedThisMonth: number       // completed this calendar month (YYYY-MM)
  outstandingThisMonth: number  // planned this calendar month
  transactions: RevenueTransaction[]  // all treatments with price > 0, newest first
}

// ── Integration ───────────────────────────────────────────────────────────────

export interface IntegrationConfig {
  apiUrl: string
  clinicName: string
  username: string
  password: string
}

export interface SyncResult {
  synced: number
  errors: string[]
}

// ── CSV Import/Export ─────────────────────────────────────────────────────────

export interface CsvImportResult {
  patientsCreated: number
  patientsSkipped: number
  treatmentsAdded: number
  errors: string[]
}

// ── License ───────────────────────────────────────────────────────────────────

export interface LicenseStatus {
  activated: boolean
  licensee?: string
  email?: string | null
  expiresAt?: string | null
  error?: string
}

export interface ActivateResult {
  success: boolean
  licensee?: string
  error?: string
}

export interface LicenseMachineCode {
  machineCode: string
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
  getToothNote: (patientId: number, toothFdi: number) => Promise<string>
  setToothNote: (patientId: number, toothFdi: number, notes: string) => Promise<string>

  listTreatmentsForTooth: (patientId: number, toothFdi: number) => Promise<Treatment[]>
  listTreatmentsForPatient: (patientId: number) => Promise<Treatment[]>
  addTreatment: (data: AddTreatmentRequest) => Promise<Treatment>
  updateTreatmentNotes: (data: UpdateTreatmentNotesRequest) => Promise<Treatment>

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
  getLicenseMachineCode: () => Promise<LicenseMachineCode>

  // Onboarding
  getOnboardingStatus: () => Promise<boolean>
  completeOnboarding: () => Promise<void>

  // CSV
  exportPatientsCsv: () => Promise<string>
  importPatientsCsv: (csv: string) => Promise<CsvImportResult>

  // Revenue
  getRevenueStats: () => Promise<RevenueStats>

  // Integration
  getIntegrationConfig: () => Promise<IntegrationConfig>
  saveIntegrationConfig: (config: IntegrationConfig) => Promise<void>
  testIntegrationConnection: () => Promise<{ success: boolean; error?: string }>
  syncExternalAppointments: () => Promise<SyncResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
