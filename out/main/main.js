"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Database = require("better-sqlite3");
const fs = require("fs");
const crypto = require("crypto");
const electronUpdater = require("electron-updater");
let db;
function getDb() {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}
function initDatabase() {
  const userDataPath = electron.app.getPath("userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const dbPath = path.join(userDataPath, "dental.db");
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
function validateCreateRequest$1(data) {
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
function validateUpdateRequest$1(data) {
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
    return createPatient(getDb(), validateCreateRequest$1(data));
  });
  electron.ipcMain.handle("patients:update", (_event, id, data) => {
    return updatePatient(getDb(), validateId(id), validateUpdateRequest$1(data));
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
function validateToothFdi$1(toothFdi) {
  if (typeof toothFdi !== "number" || !Number.isInteger(toothFdi) || !isValidFdiNumber$1(toothFdi)) {
    throw new Error("Invalid toothFdi: must be a valid FDI tooth number");
  }
  return toothFdi;
}
function validateNotes(notes) {
  if (typeof notes !== "string") {
    throw new Error("Invalid notes: must be a string");
  }
  return notes.trim();
}
function registerTeethHandlers() {
  electron.ipcMain.handle("teeth:getChart", (_event, patientId) => {
    return getChartForPatient(getDb(), validatePatientId$1(patientId));
  });
  electron.ipcMain.handle("teeth:setCondition", (_event, data) => {
    setToothCondition(getDb(), validateSetConditionRequest(data));
  });
  electron.ipcMain.handle("teeth:getToothNote", (_event, patientId, toothFdi) => {
    const pid = validatePatientId$1(patientId);
    const fdi = validateToothFdi$1(toothFdi);
    const db2 = getDb();
    const row = db2.prepare(
      "SELECT notes FROM tooth_notes WHERE patient_id = ? AND tooth_fdi = ?"
    ).get(pid, fdi);
    return row ? row.notes : "";
  });
  electron.ipcMain.handle(
    "teeth:setToothNote",
    (_event, patientId, toothFdi, notes) => {
      const pid = validatePatientId$1(patientId);
      const fdi = validateToothFdi$1(toothFdi);
      const trimmedNotes = validateNotes(notes);
      const db2 = getDb();
      db2.prepare(
        `INSERT INTO tooth_notes (patient_id, tooth_fdi, notes, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(patient_id, tooth_fdi)
         DO UPDATE SET notes = excluded.notes, updated_at = excluded.updated_at`
      ).run(pid, fdi, trimmedNotes);
      return trimmedNotes;
    }
  );
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
    price,
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
  const insertTreatment = db2.prepare(
    `INSERT INTO treatments
      (patient_id, tooth_fdi, surface, condition_type, status, date_performed, performed_by, notes, price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const upsertCondition = db2.prepare(
    `INSERT INTO tooth_conditions (patient_id, tooth_fdi, surface, condition)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(patient_id, tooth_fdi, surface) DO UPDATE SET condition = excluded.condition`
  );
  let treatment;
  db2.transaction(() => {
    const result = insertTreatment.run(
      data.patientId,
      data.toothFdi,
      data.surface ?? null,
      data.conditionType,
      data.status,
      data.datePerformed,
      data.performedBy ?? null,
      data.notes ?? null,
      data.price ?? null
    );
    treatment = db2.prepare(`${SELECT_TREATMENT} WHERE id = ?`).get(result.lastInsertRowid);
    if (!treatment) {
      throw new Error(`Failed to retrieve treatment after insert (rowid ${result.lastInsertRowid})`);
    }
    const conditionSurface = data.surface ?? "occlusal";
    upsertCondition.run(data.patientId, data.toothFdi, conditionSurface, data.conditionType);
  })();
  return treatment;
}
function updateTreatmentNotes(db2, data) {
  const result = db2.prepare(
    `UPDATE treatments SET notes = ?, price = ? WHERE id = ? AND status = 'planned'`
  ).run(data.notes ?? null, data.price ?? null, data.id);
  if (result.changes === 0) {
    throw new Error("Treatment not found or not editable");
  }
  const treatment = db2.prepare(`${SELECT_TREATMENT} WHERE id = ?`).get(data.id);
  if (!treatment) {
    throw new Error(`Failed to retrieve treatment after update (id ${data.id})`);
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
const VALID_STATUSES$1 = /* @__PURE__ */ new Set(["planned", "completed", "referred"]);
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
  if (typeof d.status !== "string" || !VALID_STATUSES$1.has(d.status)) {
    throw new Error(
      `Invalid treatment data: status must be one of ${[...VALID_STATUSES$1].join(", ")}`
    );
  }
  if (typeof d.datePerformed !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.datePerformed)) {
    throw new Error("Invalid treatment data: datePerformed must be a YYYY-MM-DD string");
  }
  let price = null;
  if (d.price !== null && d.price !== void 0) {
    if (typeof d.price !== "number" || !isFinite(d.price) || d.price < 0) {
      throw new Error("Invalid treatment data: price must be a non-negative finite number or null");
    }
    price = d.price;
  }
  return {
    patientId: d.patientId,
    toothFdi: d.toothFdi,
    surface: d.surface ?? null,
    conditionType: d.conditionType,
    status: d.status,
    datePerformed: d.datePerformed,
    performedBy: typeof d.performedBy === "string" ? d.performedBy : null,
    notes: typeof d.notes === "string" ? d.notes : null,
    price
  };
}
function validateUpdateTreatmentNotesRequest(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data: expected an object");
  }
  const d = data;
  if (typeof d.id !== "number" || !Number.isInteger(d.id) || d.id <= 0) {
    throw new Error("Invalid data: id must be a positive integer");
  }
  if (d.notes !== null && d.notes !== void 0 && typeof d.notes !== "string") {
    throw new Error("Invalid data: notes must be a string or null");
  }
  let price = null;
  if (d.price !== null && d.price !== void 0) {
    if (typeof d.price !== "number" || !isFinite(d.price) || d.price < 0) {
      throw new Error("Invalid data: price must be a non-negative finite number or null");
    }
    price = d.price;
  }
  return {
    id: d.id,
    notes: typeof d.notes === "string" ? d.notes : null,
    price
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
  electron.ipcMain.handle("treatments:updateNotes", (_event, data) => {
    return updateTreatmentNotes(getDb(), validateUpdateTreatmentNotesRequest(data));
  });
}
const KEYS = [
  "clinicName",
  "clinicAddress",
  "clinicPhone",
  "clinicEmail",
  "clinicWebsite",
  "dentistName"
];
function toDbKey(key) {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
function getClinicSettings() {
  const db2 = getDb();
  const rows = db2.prepare("SELECT key, value FROM clinic_settings").all();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    clinicName: map["clinic_name"] ?? "",
    clinicAddress: map["clinic_address"] ?? "",
    clinicPhone: map["clinic_phone"] ?? "",
    clinicEmail: map["clinic_email"] ?? "",
    clinicWebsite: map["clinic_website"] ?? "",
    dentistName: map["dentist_name"] ?? ""
  };
}
function updateClinicSettings(data) {
  const db2 = getDb();
  const update = db2.prepare(
    "INSERT OR REPLACE INTO clinic_settings (key, value) VALUES (?, ?)"
  );
  const tx = db2.transaction((updates) => {
    for (const key of KEYS) {
      if (key in updates && updates[key] !== void 0) {
        update.run(toDbKey(key), updates[key]);
      }
    }
  });
  tx(data);
  return getClinicSettings();
}
const VALID_SETTINGS_KEYS = /* @__PURE__ */ new Set([
  "clinicName",
  "clinicAddress",
  "clinicPhone",
  "clinicEmail",
  "clinicWebsite",
  "dentistName"
]);
function validatePartialClinicSettings(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid clinic settings: expected a non-array object");
  }
  const d = data;
  const validated = {};
  for (const key of VALID_SETTINGS_KEYS) {
    if (!(key in d)) continue;
    const val = d[key];
    if (typeof val !== "string") {
      throw new Error(`Invalid clinic settings: field "${key}" must be a string`);
    }
    validated[key] = val;
  }
  return validated;
}
function registerClinicSettingsHandlers() {
  electron.ipcMain.handle("clinic:getSettings", () => {
    return getClinicSettings();
  });
  electron.ipcMain.handle("clinic:updateSettings", (_event, data) => {
    const validated = validatePartialClinicSettings(data);
    return updateClinicSettings(validated);
  });
}
function rowToAppointment(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
const SELECT_APPOINTMENT = `
  SELECT
    id,
    patient_id,
    title,
    date,
    start_time,
    end_time,
    status,
    notes,
    created_at,
    updated_at
  FROM appointments
`;
function listAppointments(date) {
  const db2 = getDb();
  if (date !== void 0) {
    const rows2 = db2.prepare(`${SELECT_APPOINTMENT} WHERE date = ? ORDER BY start_time ASC`).all(date);
    return rows2.map(rowToAppointment);
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const rows = db2.prepare(`${SELECT_APPOINTMENT} WHERE date >= ? ORDER BY date ASC, start_time ASC`).all(today);
  return rows.map(rowToAppointment);
}
function listAppointmentsForPatient(patientId) {
  const db2 = getDb();
  const rows = db2.prepare(`${SELECT_APPOINTMENT} WHERE patient_id = ? ORDER BY date DESC, start_time DESC`).all(patientId);
  return rows.map(rowToAppointment);
}
function createAppointment(data) {
  const db2 = getDb();
  const result = db2.prepare(
    `INSERT INTO appointments
        (patient_id, title, date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.patientId,
    data.title,
    data.date,
    data.startTime,
    data.endTime,
    data.status,
    data.notes ?? null
  );
  const row = db2.prepare(`${SELECT_APPOINTMENT} WHERE id = ?`).get(result.lastInsertRowid);
  if (!row) {
    throw new Error(
      `Failed to retrieve appointment after insert (rowid ${result.lastInsertRowid})`
    );
  }
  return rowToAppointment(row);
}
function updateAppointment(id, data) {
  const db2 = getDb();
  const setClauses = [];
  const params = [];
  if (data.patientId !== void 0) {
    setClauses.push("patient_id = ?");
    params.push(data.patientId);
  }
  if (data.title !== void 0) {
    setClauses.push("title = ?");
    params.push(data.title);
  }
  if (data.date !== void 0) {
    setClauses.push("date = ?");
    params.push(data.date);
  }
  if (data.startTime !== void 0) {
    setClauses.push("start_time = ?");
    params.push(data.startTime);
  }
  if (data.endTime !== void 0) {
    setClauses.push("end_time = ?");
    params.push(data.endTime);
  }
  if (data.status !== void 0) {
    setClauses.push("status = ?");
    params.push(data.status);
  }
  if ("notes" in data) {
    setClauses.push("notes = ?");
    params.push(data.notes ?? null);
  }
  if (setClauses.length === 0) {
    const row = db2.prepare(`${SELECT_APPOINTMENT} WHERE id = ?`).get(id);
    return row ? rowToAppointment(row) : void 0;
  }
  setClauses.push("updated_at = datetime('now')");
  params.push(id);
  db2.prepare(`UPDATE appointments SET ${setClauses.join(", ")} WHERE id = ?`).run(...params);
  const updated = db2.prepare(`${SELECT_APPOINTMENT} WHERE id = ?`).get(id);
  return updated ? rowToAppointment(updated) : void 0;
}
function deleteAppointment(id) {
  const db2 = getDb();
  const result = db2.prepare("DELETE FROM appointments WHERE id = ?").run(id);
  return result.changes > 0;
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const VALID_STATUSES = /* @__PURE__ */ new Set([
  "scheduled",
  "completed",
  "cancelled",
  "no_show"
]);
function validateDate(value, field) {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    throw new Error(`Invalid appointment: "${field}" must be a YYYY-MM-DD string`);
  }
  return value;
}
function validateTime(value, field) {
  if (typeof value !== "string" || !TIME_RE.test(value)) {
    throw new Error(`Invalid appointment: "${field}" must be a HH:MM string`);
  }
  return value;
}
function validatePositiveInt(value, field) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid appointment: "${field}" must be a positive integer`);
  }
  return value;
}
function validateStatus(value) {
  if (typeof value !== "string" || !VALID_STATUSES.has(value)) {
    throw new Error(
      `Invalid appointment: "status" must be one of ${[...VALID_STATUSES].join(", ")}`
    );
  }
  return value;
}
function validateCreateRequest(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid appointment: expected a non-array object");
  }
  const d = data;
  const patientId = validatePositiveInt(d.patientId, "patientId");
  if (typeof d.title !== "string" || d.title.trim().length === 0) {
    throw new Error('Invalid appointment: "title" must be a non-empty string');
  }
  const title = d.title.trim();
  const date = validateDate(d.date, "date");
  const startTime = validateTime(d.startTime, "startTime");
  const endTime = validateTime(d.endTime, "endTime");
  if (endTime <= startTime) {
    throw new Error('Invalid appointment: "endTime" must be after "startTime"');
  }
  const status = validateStatus(d.status);
  const notes = d.notes === null || d.notes === void 0 ? null : typeof d.notes === "string" ? d.notes : (() => {
    throw new Error('Invalid appointment: "notes" must be a string or null');
  })();
  return { patientId, title, date, startTime, endTime, status, notes };
}
function validateUpdateRequest(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid appointment update: expected a non-array object");
  }
  const d = data;
  const validated = {};
  if ("patientId" in d) {
    validated.patientId = validatePositiveInt(d.patientId, "patientId");
  }
  if ("title" in d) {
    if (typeof d.title !== "string" || d.title.trim().length === 0) {
      throw new Error('Invalid appointment update: "title" must be a non-empty string');
    }
    validated.title = d.title.trim();
  }
  if ("date" in d) {
    validated.date = validateDate(d.date, "date");
  }
  if ("startTime" in d) {
    validated.startTime = validateTime(d.startTime, "startTime");
  }
  if ("endTime" in d) {
    validated.endTime = validateTime(d.endTime, "endTime");
  }
  if (validated.startTime !== void 0 && validated.endTime !== void 0) {
    if (validated.endTime <= validated.startTime) {
      throw new Error('Invalid appointment update: "endTime" must be after "startTime"');
    }
  }
  if ("status" in d) {
    validated.status = validateStatus(d.status);
  }
  if ("notes" in d) {
    if (d.notes !== null && typeof d.notes !== "string") {
      throw new Error('Invalid appointment update: "notes" must be a string or null');
    }
    validated.notes = d.notes;
  }
  return validated;
}
function registerAppointmentHandlers() {
  electron.ipcMain.handle("appointments:list", (_event, date) => {
    if (date !== void 0 && date !== null) {
      const validated = validateDate(date, "date");
      return listAppointments(validated);
    }
    return listAppointments();
  });
  electron.ipcMain.handle(
    "appointments:listForPatient",
    (_event, patientId) => {
      return listAppointmentsForPatient(validatePositiveInt(patientId, "patientId"));
    }
  );
  electron.ipcMain.handle("appointments:create", (_event, data) => {
    return createAppointment(validateCreateRequest(data));
  });
  electron.ipcMain.handle(
    "appointments:update",
    (_event, id, data) => {
      const validId = validatePositiveInt(id, "id");
      const validData = validateUpdateRequest(data);
      const result = updateAppointment(validId, validData);
      if (!result) {
        throw new Error(`Appointment with id ${validId} not found`);
      }
      return result;
    }
  );
  electron.ipcMain.handle("appointments:delete", (_event, id) => {
    const validId = validatePositiveInt(id, "id");
    const deleted = deleteAppointment(validId);
    if (!deleted) {
      throw new Error(`Appointment with id ${validId} not found`);
    }
  });
}
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQPnKyrPERw3p2ZpUpak9CX42nG6+Q7Ga1xEcdopmnBk=
-----END PUBLIC KEY-----`;
function validateLicenseKey(key) {
  try {
    const trimmed = key.trim();
    const dotIndex = trimmed.lastIndexOf(".");
    if (dotIndex === -1) return { valid: false, error: "Invalid key format" };
    const payloadB64 = trimmed.slice(0, dotIndex);
    const sigB64 = trimmed.slice(dotIndex + 1);
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const signature = Buffer.from(sigB64, "base64url");
    let payload;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      return { valid: false, error: "Invalid key format" };
    }
    if (payload.productId !== "dental-cartography") {
      return { valid: false, error: "Invalid product" };
    }
    if (payload.expiresAt !== null && new Date(payload.expiresAt) < /* @__PURE__ */ new Date()) {
      return { valid: false, error: "License has expired" };
    }
    const isValid = crypto.verify(
      null,
      Buffer.from(payloadJson),
      { key: PUBLIC_KEY_PEM, format: "pem", type: "spki" },
      signature
    );
    if (!isValid) return { valid: false, error: "Invalid license signature" };
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Invalid key format" };
  }
}
function registerLicenseHandlers() {
  electron.ipcMain.handle("license:getStatus", () => {
    const db2 = getDb();
    const row = db2.prepare(
      "SELECT licensee, email, expires_at FROM license_activations ORDER BY id DESC LIMIT 1"
    ).get();
    if (!row) return { activated: false };
    return {
      activated: true,
      licensee: row.licensee,
      email: row.email,
      expiresAt: row.expires_at
    };
  });
  electron.ipcMain.handle("license:activate", (_event, key) => {
    if (typeof key !== "string" || key.length === 0) {
      return { success: false, error: "License key is required" };
    }
    const result = validateLicenseKey(key);
    if (!result.valid || !result.payload) {
      return { success: false, error: result.error ?? "Invalid license key" };
    }
    const db2 = getDb();
    try {
      db2.prepare(
        `INSERT OR IGNORE INTO license_activations (license_key, licensee, email, issued_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        key.trim(),
        result.payload.licensee,
        result.payload.email,
        result.payload.issuedAt,
        result.payload.expiresAt
      );
    } catch {
      return { success: false, error: "Failed to save activation" };
    }
    return { success: true, licensee: result.payload.licensee };
  });
}
function registerOnboardingHandlers() {
  electron.ipcMain.handle("onboarding:getStatus", () => {
    const db2 = getDb();
    const row = db2.prepare("SELECT value FROM meta WHERE key = 'onboarding_completed'").get();
    return row?.value === "1";
  });
  electron.ipcMain.handle("onboarding:complete", () => {
    const db2 = getDb();
    db2.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('onboarding_completed', '1')").run();
  });
}
function escapeCsvField(value) {
  if (value === null || value === void 0) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
function toCsvRow(fields) {
  return fields.map(escapeCsvField).join(",");
}
function detectDelimiter(firstLine) {
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}
function parseCsvLine(line, delimiter) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    i++;
  }
  fields.push(current);
  return fields;
}
function parseCsv(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => parseCsvLine(line, delimiter));
}
function registerCsvHandlers() {
  electron.ipcMain.handle("patients:exportCsv", () => {
    const db2 = getDb();
    const HEADER = "full_name,date_of_birth,sex,phone,email,address,insurance_provider,insurance_policy,medical_alerts,notes,tooth_fdi,surface,condition_type,treatment_status,date_performed,performed_by,treatment_notes,price";
    const patients = db2.prepare("SELECT * FROM patients WHERE archived_at IS NULL ORDER BY full_name").all();
    const rows = [HEADER];
    for (const p of patients) {
      const patientFields = [
        p.full_name,
        p.date_of_birth,
        p.sex,
        p.phone,
        p.email,
        p.address,
        p.insurance_provider,
        p.insurance_policy,
        p.medical_alerts,
        p.notes
      ];
      const treatments = db2.prepare("SELECT * FROM treatments WHERE patient_id = ? ORDER BY date_performed").all(p.id);
      if (treatments.length === 0) {
        rows.push(toCsvRow([...patientFields, "", "", "", "", "", "", "", ""]));
      } else {
        for (const t of treatments) {
          rows.push(
            toCsvRow([
              ...patientFields,
              t.tooth_fdi,
              t.surface,
              t.condition_type,
              t.status,
              t.date_performed,
              t.performed_by,
              t.notes,
              t.price
            ])
          );
        }
      }
    }
    return rows.join("\n");
  });
  electron.ipcMain.handle("patients:importCsv", (_event, csvContent) => {
    if (typeof csvContent !== "string") {
      return {
        patientsCreated: 0,
        patientsSkipped: 0,
        treatmentsAdded: 0,
        errors: ["Invalid input: expected a CSV string"]
      };
    }
    const db2 = getDb();
    const rows = parseCsv(csvContent);
    const dataRows = rows[0]?.[0]?.toLowerCase().trim() === "full_name" ? rows.slice(1) : rows;
    let patientsCreated = 0;
    let patientsSkipped = 0;
    let treatmentsAdded = 0;
    const errors = [];
    const patientGroups = /* @__PURE__ */ new Map();
    for (const row of dataRows) {
      if (row.length < 3) continue;
      const key = `${row[0]?.trim()}|${row[1]?.trim()}|${row[2]?.trim()}`;
      const group = patientGroups.get(key);
      if (group) {
        group.push(row);
      } else {
        patientGroups.set(key, [row]);
      }
    }
    const insertPatient = db2.prepare(`
      INSERT INTO patients (full_name, date_of_birth, sex, phone, email, address,
        insurance_provider, insurance_policy, medical_alerts, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTreatment = db2.prepare(`
      INSERT INTO treatments (patient_id, tooth_fdi, surface, condition_type, status,
        date_performed, performed_by, notes, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const upsertCondition = db2.prepare(`
      INSERT INTO tooth_conditions (patient_id, tooth_fdi, surface, condition)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(patient_id, tooth_fdi, surface) DO UPDATE SET condition = excluded.condition
    `);
    const findPatient = db2.prepare(
      "SELECT id FROM patients WHERE full_name = ? AND date_of_birth = ? AND sex = ? AND archived_at IS NULL"
    );
    const importAll = db2.transaction(() => {
      for (const [key, groupRows] of patientGroups) {
        const firstRow = groupRows[0];
        const fullName = firstRow[0]?.trim();
        const dob = firstRow[1]?.trim();
        const sex = firstRow[2]?.trim();
        if (!fullName || !dob || !sex) {
          errors.push(`Skipping row with missing required fields: ${key}`);
          continue;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
          errors.push(`Skipping "${fullName}": date_of_birth must be YYYY-MM-DD, got "${dob}"`);
          continue;
        }
        if (!["male", "female", "other"].includes(sex)) {
          errors.push(
            `Skipping "${fullName}": sex must be male/female/other, got "${sex}"`
          );
          continue;
        }
        const existing = findPatient.get(fullName, dob, sex);
        let patientId;
        if (existing) {
          patientId = existing.id;
          patientsSkipped++;
        } else {
          const result = insertPatient.run(
            fullName,
            dob,
            sex,
            firstRow[3]?.trim() || null,
            firstRow[4]?.trim() || null,
            firstRow[5]?.trim() || null,
            firstRow[6]?.trim() || null,
            firstRow[7]?.trim() || null,
            firstRow[8]?.trim() || null,
            firstRow[9]?.trim() || null
          );
          patientId = Number(result.lastInsertRowid);
          patientsCreated++;
        }
        for (const row of groupRows) {
          const toothFdiStr = row[10]?.trim();
          if (!toothFdiStr) continue;
          const toothFdi = Number(toothFdiStr);
          if (!Number.isInteger(toothFdi) || toothFdi <= 0) {
            errors.push(
              `Treatment skipped for "${fullName}": invalid tooth_fdi "${toothFdiStr}"`
            );
            continue;
          }
          const surface = row[11]?.trim() || null;
          const conditionType = row[12]?.trim();
          const status = row[13]?.trim();
          const datePerformed = row[14]?.trim();
          if (!conditionType || !status || !datePerformed) {
            errors.push(
              `Treatment skipped for "${fullName}": missing condition_type, status, or date_performed`
            );
            continue;
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(datePerformed)) {
            errors.push(
              `Treatment skipped for "${fullName}": date_performed must be YYYY-MM-DD, got "${datePerformed}"`
            );
            continue;
          }
          const priceStr = row[17]?.trim();
          const price = priceStr ? Number(priceStr) : null;
          if (price !== null && isNaN(price)) {
            errors.push(
              `Treatment skipped for "${fullName}": price is not a valid number "${priceStr}"`
            );
            continue;
          }
          try {
            insertTreatment.run(
              patientId,
              toothFdi,
              surface,
              conditionType,
              status,
              datePerformed,
              row[15]?.trim() || null,
              row[16]?.trim() || null,
              price
            );
            treatmentsAdded++;
            if (surface) {
              upsertCondition.run(patientId, toothFdi, surface, conditionType);
            }
          } catch (err) {
            errors.push(
              `Treatment insert error for "${fullName}": ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      }
    });
    try {
      importAll();
    } catch (err) {
      errors.push(
        `Transaction failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return { patientsCreated, patientsSkipped, treatmentsAdded, errors };
  });
}
const TRANSACTION_SQL = `
  SELECT
    t.id          AS treatmentId,
    t.patient_id  AS patientId,
    p.full_name   AS patientName,
    t.condition_type AS conditionType,
    t.tooth_fdi   AS toothFdi,
    t.surface,
    t.status,
    t.date_performed AS datePerformed,
    t.price
  FROM treatments t
  JOIN patients p ON p.id = t.patient_id
  WHERE t.price IS NOT NULL AND t.price > 0 AND p.archived_at IS NULL
  ORDER BY t.date_performed DESC, t.id DESC
`;
function currentYearMonth() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
function computeStats(rows) {
  const thisMonth = currentYearMonth();
  let totalEarned = 0;
  let totalOutstanding = 0;
  let earnedThisMonth = 0;
  let outstandingThisMonth = 0;
  const transactions = [];
  for (const row of rows) {
    const rowMonth = row.datePerformed.slice(0, 7);
    if (row.status === "completed") {
      totalEarned += row.price;
      if (rowMonth === thisMonth) {
        earnedThisMonth += row.price;
      }
    } else if (row.status === "planned") {
      totalOutstanding += row.price;
      if (rowMonth === thisMonth) {
        outstandingThisMonth += row.price;
      }
    }
    transactions.push({
      treatmentId: row.treatmentId,
      patientId: row.patientId,
      patientName: row.patientName,
      conditionType: row.conditionType,
      toothFdi: row.toothFdi,
      surface: row.surface,
      status: row.status,
      datePerformed: row.datePerformed,
      price: row.price
    });
  }
  return {
    totalEarned,
    totalOutstanding,
    earnedThisMonth,
    outstandingThisMonth,
    transactions
  };
}
function registerRevenueHandlers() {
  electron.ipcMain.handle("revenue:getStats", () => {
    const db2 = getDb();
    const rows = db2.prepare(TRANSACTION_SQL).all();
    return computeStats(rows);
  });
}
function registerIpcHandlers() {
  registerPatientHandlers();
  registerTeethHandlers();
  registerTreatmentHandlers();
  registerClinicSettingsHandlers();
  registerAppointmentHandlers();
  registerLicenseHandlers();
  registerOnboardingHandlers();
  registerCsvHandlers();
  registerRevenueHandlers();
}
function initAutoUpdater(win) {
  if (!electron.app.isPackaged) return;
  electronUpdater.autoUpdater.autoDownload = true;
  electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
  function send(status) {
    win.webContents.send("updater:status", status);
  }
  electronUpdater.autoUpdater.on("checking-for-update", () => send({ kind: "checking" }));
  electronUpdater.autoUpdater.on(
    "update-available",
    (info) => send({ kind: "available", version: info.version })
  );
  electronUpdater.autoUpdater.on("update-not-available", () => send({ kind: "not-available" }));
  electronUpdater.autoUpdater.on(
    "download-progress",
    (progress) => send({ kind: "downloading", percent: Math.round(progress.percent) })
  );
  electronUpdater.autoUpdater.on(
    "update-downloaded",
    (info) => send({ kind: "downloaded", version: info.version })
  );
  electronUpdater.autoUpdater.on(
    "error",
    (err) => send({ kind: "error", message: err.message })
  );
  electron.ipcMain.handle("updater:quitAndInstall", () => {
    electronUpdater.autoUpdater.quitAndInstall();
  });
  setTimeout(() => {
    void electronUpdater.autoUpdater.checkForUpdates();
  }, 3e3);
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...process.platform === "darwin" ? { trafficLightPosition: { x: 16, y: 14 } } : {},
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
  return win;
}
electron.app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  const win = createWindow();
  initAutoUpdater(win);
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
