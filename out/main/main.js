"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Database = require("better-sqlite3");
const fs = require("fs");
let db;
function getDb() {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}
function initDatabase() {
  const dbPath = path.join(electron.app.getPath("userData"), "dental.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations();
}
function runMigrations() {
  const migrationsDir = utils.is.dev ? path.join(electron.app.getAppPath(), "electron", "db", "migrations") : path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '0');
  `);
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get("schema_version");
  let currentVersion = row ? Number(row.value) : 0;
  const updateVersion = db.prepare(`UPDATE meta SET value = ? WHERE key = 'schema_version'`);
  for (const file of files) {
    const migrationVersion = Number(file.split("_")[0]);
    if (migrationVersion > currentVersion) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      db.exec(sql);
      updateVersion.run(String(migrationVersion));
      currentVersion = migrationVersion;
    }
  }
}
const SELECT_PATIENT = `
  SELECT
    id,
    full_name          AS fullName,
    date_of_birth      AS dateOfBirth,
    sex,
    phone,
    email,
    address,
    insurance_provider AS insuranceProvider,
    insurance_policy   AS insurancePolicy,
    medical_alerts     AS medicalAlerts,
    notes,
    archived_at        AS archivedAt,
    created_at         AS createdAt,
    updated_at         AS updatedAt
  FROM patients
`;
function listPatients(db2) {
  return db2.prepare(`${SELECT_PATIENT} WHERE archived_at IS NULL ORDER BY full_name`).all();
}
function getPatient(db2, id) {
  return db2.prepare(`${SELECT_PATIENT} WHERE id = ?`).get(id);
}
function createPatient(db2, data) {
  const result = db2.prepare(
    `INSERT INTO patients
        (full_name, date_of_birth, sex, phone, email, address,
         insurance_provider, insurance_policy, medical_alerts, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.fullName,
    data.dateOfBirth,
    data.sex,
    data.phone ?? null,
    data.email ?? null,
    data.address ?? null,
    data.insuranceProvider ?? null,
    data.insurancePolicy ?? null,
    data.medicalAlerts ?? null,
    data.notes ?? null
  );
  const patient = db2.prepare(`${SELECT_PATIENT} WHERE id = ?`).get(result.lastInsertRowid);
  if (!patient) {
    throw new Error(`Failed to retrieve patient after insert (rowid ${result.lastInsertRowid})`);
  }
  return patient;
}
function updatePatient(db2, id, data) {
  const columnMap = {
    full_name: "fullName",
    date_of_birth: "dateOfBirth",
    sex: "sex",
    phone: "phone",
    email: "email",
    address: "address",
    insurance_provider: "insuranceProvider",
    insurance_policy: "insurancePolicy",
    medical_alerts: "medicalAlerts",
    notes: "notes"
  };
  const setClauses = [];
  const values = [];
  for (const [col, field] of Object.entries(columnMap)) {
    if (data[field] !== void 0) {
      setClauses.push(`${col} = ?`);
      values.push(data[field] ?? null);
    }
  }
  if (setClauses.length === 0) {
    return getPatient(db2, id);
  }
  setClauses.push(`updated_at = datetime('now')`);
  values.push(id);
  db2.prepare(`UPDATE patients SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
  return getPatient(db2, id);
}
function archivePatient(db2, id) {
  db2.prepare(`UPDATE patients SET archived_at = datetime('now') WHERE id = ?`).run(id);
}
const VALID_SEX = /* @__PURE__ */ new Set(["male", "female", "other"]);
function validateCreateRequest(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid patient data: expected an object");
  }
  const d = data;
  if (typeof d.fullName !== "string" || d.fullName.trim().length === 0) {
    throw new Error("Invalid patient data: fullName must be a non-empty string");
  }
  if (typeof d.dateOfBirth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth)) {
    throw new Error("Invalid patient data: dateOfBirth must be a YYYY-MM-DD string");
  }
  if (typeof d.sex !== "string" || !VALID_SEX.has(d.sex)) {
    throw new Error('Invalid patient data: sex must be "male", "female", or "other"');
  }
  return {
    fullName: d.fullName.trim(),
    dateOfBirth: d.dateOfBirth,
    sex: d.sex,
    phone: typeof d.phone === "string" ? d.phone : null,
    email: typeof d.email === "string" ? d.email : null,
    address: typeof d.address === "string" ? d.address : null,
    insuranceProvider: typeof d.insuranceProvider === "string" ? d.insuranceProvider : null,
    insurancePolicy: typeof d.insurancePolicy === "string" ? d.insurancePolicy : null,
    medicalAlerts: typeof d.medicalAlerts === "string" ? d.medicalAlerts : null,
    notes: typeof d.notes === "string" ? d.notes : null
  };
}
function validateUpdateRequest(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid update data: expected an object");
  }
  const d = data;
  const result = {};
  if (d.fullName !== void 0) {
    if (typeof d.fullName !== "string" || d.fullName.trim().length === 0) {
      throw new Error("Invalid update data: fullName must be a non-empty string");
    }
    result.fullName = d.fullName.trim();
  }
  if (d.dateOfBirth !== void 0) {
    if (typeof d.dateOfBirth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth)) {
      throw new Error("Invalid update data: dateOfBirth must be a YYYY-MM-DD string");
    }
    result.dateOfBirth = d.dateOfBirth;
  }
  if (d.sex !== void 0) {
    if (typeof d.sex !== "string" || !VALID_SEX.has(d.sex)) {
      throw new Error('Invalid update data: sex must be "male", "female", or "other"');
    }
    result.sex = d.sex;
  }
  if (d.phone !== void 0) result.phone = typeof d.phone === "string" ? d.phone : null;
  if (d.email !== void 0) result.email = typeof d.email === "string" ? d.email : null;
  if (d.address !== void 0) result.address = typeof d.address === "string" ? d.address : null;
  if (d.insuranceProvider !== void 0)
    result.insuranceProvider = typeof d.insuranceProvider === "string" ? d.insuranceProvider : null;
  if (d.insurancePolicy !== void 0)
    result.insurancePolicy = typeof d.insurancePolicy === "string" ? d.insurancePolicy : null;
  if (d.medicalAlerts !== void 0)
    result.medicalAlerts = typeof d.medicalAlerts === "string" ? d.medicalAlerts : null;
  if (d.notes !== void 0) result.notes = typeof d.notes === "string" ? d.notes : null;
  return result;
}
function validateId(id) {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid id: must be a positive integer");
  }
  return id;
}
function registerPatientHandlers() {
  electron.ipcMain.handle("patients:list", () => {
    return listPatients(getDb());
  });
  electron.ipcMain.handle("patients:get", (_event, id) => {
    return getPatient(getDb(), validateId(id));
  });
  electron.ipcMain.handle("patients:create", (_event, data) => {
    return createPatient(getDb(), validateCreateRequest(data));
  });
  electron.ipcMain.handle("patients:update", (_event, id, data) => {
    return updatePatient(getDb(), validateId(id), validateUpdateRequest(data));
  });
  electron.ipcMain.handle("patients:archive", (_event, id) => {
    archivePatient(getDb(), validateId(id));
  });
}
function getChartForPatient(db2, patientId) {
  const rows = db2.prepare(
    `SELECT tooth_fdi AS toothFdi, surface, condition
       FROM tooth_conditions
       WHERE patient_id = ?
       ORDER BY tooth_fdi, surface`
  ).all(patientId);
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!map.has(row.toothFdi)) {
      map.set(row.toothFdi, { toothFdi: row.toothFdi, surfaces: [] });
    }
    const entry = map.get(row.toothFdi);
    if (entry) {
      entry.surfaces.push({
        surface: row.surface,
        condition: row.condition
      });
    }
  }
  return Array.from(map.values());
}
function setToothCondition(db2, data) {
  db2.prepare(
    `INSERT INTO tooth_conditions (patient_id, tooth_fdi, surface, condition, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(patient_id, tooth_fdi, surface)
     DO UPDATE SET condition = excluded.condition, updated_at = excluded.updated_at`
  ).run(data.patientId, data.toothFdi, data.surface, data.condition);
}
const VALID_SURFACES$1 = /* @__PURE__ */ new Set([
  "occlusal",
  "mesial",
  "distal",
  "buccal",
  "lingual",
  "incisal"
]);
const VALID_CONDITIONS$1 = /* @__PURE__ */ new Set([
  "healthy",
  "caries",
  "filling_amalgam",
  "filling_composite",
  "crown",
  "extraction",
  "missing_congenital",
  "implant",
  "root_canal",
  "bridge_pontic",
  "fracture",
  "watch"
]);
function isValidFdiNumber$1(n) {
  const quadrant = Math.floor(n / 10);
  const position = n % 10;
  if (quadrant >= 1 && quadrant <= 4) return position >= 1 && position <= 8;
  if (quadrant >= 5 && quadrant <= 8) return position >= 1 && position <= 5;
  return false;
}
function validatePatientId$1(id) {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid patientId: must be a positive integer");
  }
  return id;
}
function validateSetConditionRequest(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid setToothCondition data: expected an object");
  }
  const d = data;
  if (typeof d.patientId !== "number" || !Number.isInteger(d.patientId) || d.patientId <= 0) {
    throw new Error("Invalid setToothCondition data: patientId must be a positive integer");
  }
  if (typeof d.toothFdi !== "number" || !Number.isInteger(d.toothFdi) || !isValidFdiNumber$1(d.toothFdi)) {
    throw new Error("Invalid setToothCondition data: toothFdi must be a valid FDI tooth number");
  }
  if (typeof d.surface !== "string" || !VALID_SURFACES$1.has(d.surface)) {
    throw new Error(
      `Invalid setToothCondition data: surface must be one of ${[...VALID_SURFACES$1].join(", ")}`
    );
  }
  if (typeof d.condition !== "string" || !VALID_CONDITIONS$1.has(d.condition)) {
    throw new Error(
      `Invalid setToothCondition data: condition must be one of ${[...VALID_CONDITIONS$1].join(", ")}`
    );
  }
  return {
    patientId: d.patientId,
    toothFdi: d.toothFdi,
    surface: d.surface,
    condition: d.condition
  };
}
function registerTeethHandlers() {
  electron.ipcMain.handle("teeth:getChart", (_event, patientId) => {
    return getChartForPatient(getDb(), validatePatientId$1(patientId));
  });
  electron.ipcMain.handle("teeth:setCondition", (_event, data) => {
    setToothCondition(getDb(), validateSetConditionRequest(data));
  });
}
const SELECT_TREATMENT = `
  SELECT
    id,
    patient_id     AS patientId,
    tooth_fdi      AS toothFdi,
    surface,
    condition_type AS conditionType,
    status,
    date_performed AS datePerformed,
    performed_by   AS performedBy,
    notes,
    created_at     AS createdAt
  FROM treatments
`;
function listTreatmentsForPatient(db2, patientId) {
  return db2.prepare(`${SELECT_TREATMENT} WHERE patient_id = ? ORDER BY date_performed DESC`).all(patientId);
}
function listTreatmentsForTooth(db2, patientId, toothFdi) {
  return db2.prepare(
    `${SELECT_TREATMENT} WHERE patient_id = ? AND tooth_fdi = ? ORDER BY date_performed DESC`
  ).all(patientId, toothFdi);
}
function addTreatment(db2, data) {
  const result = db2.prepare(
    `INSERT INTO treatments
        (patient_id, tooth_fdi, surface, condition_type, status, date_performed, performed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.patientId,
    data.toothFdi,
    data.surface ?? null,
    data.conditionType,
    data.status,
    data.datePerformed,
    data.performedBy ?? null,
    data.notes ?? null
  );
  const treatment = db2.prepare(`${SELECT_TREATMENT} WHERE id = ?`).get(result.lastInsertRowid);
  if (!treatment) {
    throw new Error(`Failed to retrieve treatment after insert (rowid ${result.lastInsertRowid})`);
  }
  return treatment;
}
const VALID_SURFACES = /* @__PURE__ */ new Set([
  "occlusal",
  "mesial",
  "distal",
  "buccal",
  "lingual",
  "incisal"
]);
const VALID_CONDITIONS = /* @__PURE__ */ new Set([
  "healthy",
  "caries",
  "filling_amalgam",
  "filling_composite",
  "crown",
  "extraction",
  "missing_congenital",
  "implant",
  "root_canal",
  "bridge_pontic",
  "fracture",
  "watch"
]);
const VALID_STATUSES = /* @__PURE__ */ new Set(["planned", "completed", "referred"]);
function isValidFdiNumber(n) {
  const quadrant = Math.floor(n / 10);
  const position = n % 10;
  if (quadrant >= 1 && quadrant <= 4) return position >= 1 && position <= 8;
  if (quadrant >= 5 && quadrant <= 8) return position >= 1 && position <= 5;
  return false;
}
function validatePatientId(id) {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid patientId: must be a positive integer");
  }
  return id;
}
function validateToothFdi(fdi) {
  if (typeof fdi !== "number" || !Number.isInteger(fdi) || !isValidFdiNumber(fdi)) {
    throw new Error("Invalid toothFdi: must be a valid FDI tooth number");
  }
  return fdi;
}
function validateAddTreatmentRequest(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid treatment data: expected an object");
  }
  const d = data;
  if (typeof d.patientId !== "number" || !Number.isInteger(d.patientId) || d.patientId <= 0) {
    throw new Error("Invalid treatment data: patientId must be a positive integer");
  }
  if (typeof d.toothFdi !== "number" || !Number.isInteger(d.toothFdi) || !isValidFdiNumber(d.toothFdi)) {
    throw new Error("Invalid treatment data: toothFdi must be a valid FDI tooth number");
  }
  if (d.surface !== null && d.surface !== void 0) {
    if (typeof d.surface !== "string" || !VALID_SURFACES.has(d.surface)) {
      throw new Error(
        `Invalid treatment data: surface must be null or one of ${[...VALID_SURFACES].join(", ")}`
      );
    }
  }
  if (typeof d.conditionType !== "string" || !VALID_CONDITIONS.has(d.conditionType)) {
    throw new Error(
      `Invalid treatment data: conditionType must be one of ${[...VALID_CONDITIONS].join(", ")}`
    );
  }
  if (typeof d.status !== "string" || !VALID_STATUSES.has(d.status)) {
    throw new Error(
      `Invalid treatment data: status must be one of ${[...VALID_STATUSES].join(", ")}`
    );
  }
  if (typeof d.datePerformed !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.datePerformed)) {
    throw new Error("Invalid treatment data: datePerformed must be a YYYY-MM-DD string");
  }
  return {
    patientId: d.patientId,
    toothFdi: d.toothFdi,
    surface: d.surface ?? null,
    conditionType: d.conditionType,
    status: d.status,
    datePerformed: d.datePerformed,
    performedBy: typeof d.performedBy === "string" ? d.performedBy : null,
    notes: typeof d.notes === "string" ? d.notes : null
  };
}
function registerTreatmentHandlers() {
  electron.ipcMain.handle(
    "treatments:listForTooth",
    (_event, patientId, toothFdi) => {
      return listTreatmentsForTooth(getDb(), validatePatientId(patientId), validateToothFdi(toothFdi));
    }
  );
  electron.ipcMain.handle("treatments:listForPatient", (_event, patientId) => {
    return listTreatmentsForPatient(getDb(), validatePatientId(patientId));
  });
  electron.ipcMain.handle("treatments:add", (_event, data) => {
    return addTreatment(getDb(), validateAddTreatmentRequest(data));
  });
}
function registerIpcHandlers() {
  registerPatientHandlers();
  registerTeethHandlers();
  registerTreatmentHandlers();
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.on("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
