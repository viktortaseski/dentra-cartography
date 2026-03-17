import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from '@shared/types'

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
  addTreatment: (data) => ipcRenderer.invoke('treatments:add', data)
}

contextBridge.exposeInMainWorld('electron', api)
