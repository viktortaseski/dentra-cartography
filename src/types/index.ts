// Re-export all shared types so renderer code can import from '@/types'
// instead of reaching into '@shared/types' directly.
export type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  ToothSurface,
  ToothCondition,
  SurfaceCondition,
  ToothChartEntry,
  SetToothConditionRequest,
  TreatmentStatus,
  Treatment,
  AddTreatmentRequest,
  ClinicSettings,
  AppointmentStatus,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  ElectronAPI,
} from '@shared/types'
