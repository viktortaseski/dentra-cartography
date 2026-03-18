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

  // Treatments
  listTreatmentsForTooth: (patientId, toothId) =>
    ipcRenderer.invoke('treatments:listForTooth', patientId, toothId),
  listTreatmentsForPatient: (patientId) =>
    ipcRenderer.invoke('treatments:listForPatient', patientId),
  addTreatment: (data) => ipcRenderer.invoke('treatments:add', data),

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
}

contextBridge.exposeInMainWorld('electron', api)
