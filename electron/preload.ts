import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { ElectronAPI, LicenseStatus, ActivateResult, UpdateStatus } from '@shared/types'

const api: ElectronAPI = {
  // Patients
  listPatients: () => ipcRenderer.invoke('patients:list'),
  getPatient: (id) => ipcRenderer.invoke('patients:get', id),
  createPatient: (data) => ipcRenderer.invoke('patients:create', data),
  updatePatient: (id, data) => ipcRenderer.invoke('patients:update', id, data),
  archivePatient: (id) => ipcRenderer.invoke('patients:archive', id),

  // Teeth / Chart
  getChartForPatient: (patientId) => ipcRenderer.invoke('teeth:getChart', patientId),
  setToothCondition: (data) => ipcRenderer.invoke('teeth:setCondition', data),
  getToothNote: (patientId, toothFdi) => ipcRenderer.invoke('teeth:getToothNote', patientId, toothFdi),
  setToothNote: (patientId, toothFdi, notes) => ipcRenderer.invoke('teeth:setToothNote', patientId, toothFdi, notes),

  // Treatments
  listTreatmentsForTooth: (patientId, toothId) =>
    ipcRenderer.invoke('treatments:listForTooth', patientId, toothId),
  listTreatmentsForPatient: (patientId) =>
    ipcRenderer.invoke('treatments:listForPatient', patientId),
  addTreatment: (data) => ipcRenderer.invoke('treatments:add', data),
  updateTreatmentNotes: (data) => ipcRenderer.invoke('treatments:updateNotes', data),

  // Clinic settings
  getClinicSettings: () => ipcRenderer.invoke('clinic:getSettings'),
  updateClinicSettings: (data) => ipcRenderer.invoke('clinic:updateSettings', data),

  // Appointments
  listAppointments: (date?) => ipcRenderer.invoke('appointments:list', date),
  listAppointmentsForPatient: (patientId) =>
    ipcRenderer.invoke('appointments:listForPatient', patientId),
  createAppointment: (data) => ipcRenderer.invoke('appointments:create', data),
  updateAppointment: (id, data) => ipcRenderer.invoke('appointments:update', id, data),
  deleteAppointment: (id) => ipcRenderer.invoke('appointments:delete', id),

  // Auto-update
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const listener = (_: IpcRendererEvent, status: UpdateStatus) => callback(status)
    ipcRenderer.on('updater:status', listener)
    return () => ipcRenderer.removeListener('updater:status', listener)
  },
  quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),

  // License
  getLicenseStatus: (): Promise<LicenseStatus> => ipcRenderer.invoke('license:getStatus'),
  activateLicense: (key: string): Promise<ActivateResult> =>
    ipcRenderer.invoke('license:activate', key),

  // Onboarding
  getOnboardingStatus: (): Promise<boolean> => ipcRenderer.invoke('onboarding:getStatus'),
  completeOnboarding: (): Promise<void> => ipcRenderer.invoke('onboarding:complete'),

  // CSV
  exportPatientsCsv: () => ipcRenderer.invoke('patients:exportCsv'),
  importPatientsCsv: (csvContent: string) => ipcRenderer.invoke('patients:importCsv', csvContent),

  // Revenue
  getRevenueStats: () => ipcRenderer.invoke('revenue:getStats'),
}

contextBridge.exposeInMainWorld('electron', api)
