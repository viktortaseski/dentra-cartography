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
  // Treatments
  listTreatmentsForTooth: (patientId, toothId) => electron.ipcRenderer.invoke("treatments:listForTooth", patientId, toothId),
  listTreatmentsForPatient: (patientId) => electron.ipcRenderer.invoke("treatments:listForPatient", patientId),
  addTreatment: (data) => electron.ipcRenderer.invoke("treatments:add", data)
};
electron.contextBridge.exposeInMainWorld("electron", api);
