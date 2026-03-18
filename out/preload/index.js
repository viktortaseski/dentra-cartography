"use strict";
const electron = require("electron");
const api = {
  // Patients
  listPatients: () => electron.ipcRenderer.invoke("patients:list"),
  getPatient: (id) => electron.ipcRenderer.invoke("patients:get", id),
  createPatient: (data) => electron.ipcRenderer.invoke("patients:create", data),
  updatePatient: (id, data) => electron.ipcRenderer.invoke("patients:update", id, data),
  archivePatient: (id) => electron.ipcRenderer.invoke("patients:archive", id),
  // Teeth / Chart
  getChartForPatient: (patientId) => electron.ipcRenderer.invoke("teeth:getChart", patientId),
  setToothCondition: (data) => electron.ipcRenderer.invoke("teeth:setCondition", data),
  getToothNote: (patientId, toothFdi) => electron.ipcRenderer.invoke("teeth:getToothNote", patientId, toothFdi),
  setToothNote: (patientId, toothFdi, notes) => electron.ipcRenderer.invoke("teeth:setToothNote", patientId, toothFdi, notes),
  // Treatments
  listTreatmentsForTooth: (patientId, toothId) => electron.ipcRenderer.invoke("treatments:listForTooth", patientId, toothId),
  listTreatmentsForPatient: (patientId) => electron.ipcRenderer.invoke("treatments:listForPatient", patientId),
  addTreatment: (data) => electron.ipcRenderer.invoke("treatments:add", data),
  updateTreatmentNotes: (data) => electron.ipcRenderer.invoke("treatments:updateNotes", data),
  // Clinic settings
  getClinicSettings: () => electron.ipcRenderer.invoke("clinic:getSettings"),
  updateClinicSettings: (data) => electron.ipcRenderer.invoke("clinic:updateSettings", data),
  // Appointments
  listAppointments: (date) => electron.ipcRenderer.invoke("appointments:list", date),
  listAppointmentsForPatient: (patientId) => electron.ipcRenderer.invoke("appointments:listForPatient", patientId),
  createAppointment: (data) => electron.ipcRenderer.invoke("appointments:create", data),
  updateAppointment: (id, data) => electron.ipcRenderer.invoke("appointments:update", id, data),
  deleteAppointment: (id) => electron.ipcRenderer.invoke("appointments:delete", id),
  // Auto-update
  onUpdateStatus: (callback) => {
    const listener = (_, status) => callback(status);
    electron.ipcRenderer.on("updater:status", listener);
    return () => electron.ipcRenderer.removeListener("updater:status", listener);
  },
  quitAndInstall: () => electron.ipcRenderer.invoke("updater:quitAndInstall"),
  // License
  getLicenseStatus: () => electron.ipcRenderer.invoke("license:getStatus"),
  activateLicense: (key) => electron.ipcRenderer.invoke("license:activate", key),
  // Onboarding
  getOnboardingStatus: () => electron.ipcRenderer.invoke("onboarding:getStatus"),
  completeOnboarding: () => electron.ipcRenderer.invoke("onboarding:complete"),
  // CSV
  exportPatientsCsv: () => electron.ipcRenderer.invoke("patients:exportCsv"),
  importPatientsCsv: (csvContent) => electron.ipcRenderer.invoke("patients:importCsv", csvContent),
  // Revenue
  getRevenueStats: () => electron.ipcRenderer.invoke("revenue:getStats")
};
electron.contextBridge.exposeInMainWorld("electron", api);
