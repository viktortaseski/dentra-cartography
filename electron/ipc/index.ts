import { registerPatientHandlers } from './patients'
import { registerTeethHandlers } from './teeth'
import { registerTreatmentHandlers } from './treatments'

export function registerIpcHandlers(): void {
  registerPatientHandlers()
  registerTeethHandlers()
  registerTreatmentHandlers()
}
