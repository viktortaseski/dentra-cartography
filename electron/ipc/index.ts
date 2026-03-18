import { registerPatientHandlers } from './patients'
import { registerTeethHandlers } from './teeth'
import { registerTreatmentHandlers } from './treatments'
import { registerClinicSettingsHandlers } from './clinicSettings'
import { registerAppointmentHandlers } from './appointments'
import { registerLicenseHandlers } from './license'
import { registerOnboardingHandlers } from './onboarding'

export function registerIpcHandlers(): void {
  registerPatientHandlers()
  registerTeethHandlers()
  registerTreatmentHandlers()
  registerClinicSettingsHandlers()
  registerAppointmentHandlers()
  registerLicenseHandlers()
  registerOnboardingHandlers()
}
