import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  ToothChartEntry,
  SetToothConditionRequest,
  Treatment,
  AddTreatmentRequest,
  UpdateTreatmentNotesRequest,
  ClinicSettings,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateStatus,
  LicenseStatus,
  ActivateResult,
  LicenseMachineCode,
  CsvImportResult,
  RevenueStats,
  IntegrationConfig,
  SyncResult,
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

export const updateTreatmentNotes = (data: UpdateTreatmentNotesRequest): Promise<Treatment> =>
  window.electron.updateTreatmentNotes(data)

// Clinic settings
export const getClinicSettings = (): Promise<ClinicSettings> =>
  window.electron.getClinicSettings()

export const updateClinicSettings = (data: Partial<ClinicSettings>): Promise<ClinicSettings> =>
  window.electron.updateClinicSettings(data)

// Appointment operations
export const listAppointments = (date?: string): Promise<Appointment[]> =>
  window.electron.listAppointments(date)

export const listAppointmentsForPatient = (patientId: number): Promise<Appointment[]> =>
  window.electron.listAppointmentsForPatient(patientId)

export const createAppointment = (data: CreateAppointmentRequest): Promise<Appointment> =>
  window.electron.createAppointment(data)

export const updateAppointment = (
  id: number,
  data: UpdateAppointmentRequest
): Promise<Appointment> => window.electron.updateAppointment(id, data)

export const deleteAppointment = (id: number): Promise<void> =>
  window.electron.deleteAppointment(id)

// Auto-update
export const onUpdateStatus = (callback: (status: UpdateStatus) => void): (() => void) =>
  window.electron.onUpdateStatus(callback)

export const quitAndInstall = (): Promise<void> =>
  window.electron.quitAndInstall()

// License
export const getLicenseStatus = (): Promise<LicenseStatus> =>
  window.electron.getLicenseStatus()

export const activateLicense = (key: string): Promise<ActivateResult> =>
  window.electron.activateLicense(key)

export const getLicenseMachineCode = (): Promise<LicenseMachineCode> =>
  window.electron.getLicenseMachineCode()

// Onboarding
export const getOnboardingStatus = (): Promise<boolean> =>
  window.electron.getOnboardingStatus()

export const completeOnboarding = (): Promise<void> =>
  window.electron.completeOnboarding()

// CSV
export const exportPatientsCsv = (): Promise<string> =>
  window.electron.exportPatientsCsv()

export const exportPatientsCsvSelected = (ids: number[]): Promise<string> =>
  window.electron.exportPatientsCsvSelected(ids)

export const importPatientsCsv = (csvContent: string): Promise<CsvImportResult> =>
  window.electron.importPatientsCsv(csvContent)

// Revenue
export const getRevenueStats = (): Promise<RevenueStats> =>
  window.electron.getRevenueStats()

// Tooth notes
export const getToothNote = (patientId: number, toothFdi: number): Promise<string> =>
  window.electron.getToothNote(patientId, toothFdi)

export const setToothNote = (
  patientId: number,
  toothFdi: number,
  notes: string
): Promise<string> => window.electron.setToothNote(patientId, toothFdi, notes)

// Integration
export const getIntegrationConfig = (): Promise<IntegrationConfig> =>
  window.electron.getIntegrationConfig()

export const saveIntegrationConfig = (
  config: IntegrationConfig
): Promise<void> => window.electron.saveIntegrationConfig(config)

export const testIntegrationConnection = (): Promise<{ success: boolean; error?: string }> =>
  window.electron.testIntegrationConnection()

export const syncExternalAppointments = (): Promise<SyncResult> =>
  window.electron.syncExternalAppointments()
