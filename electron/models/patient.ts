import type { Database } from 'better-sqlite3'
import type { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types'

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
`

export function listPatients(db: Database): Patient[] {
  return db
    .prepare(`${SELECT_PATIENT} WHERE archived_at IS NULL ORDER BY full_name`)
    .all() as Patient[]
}

export function getPatient(db: Database, id: number): Patient | undefined {
  return db.prepare(`${SELECT_PATIENT} WHERE id = ?`).get(id) as Patient | undefined
}

export function createPatient(db: Database, data: CreatePatientRequest): Patient {
  const result = db
    .prepare(
      `INSERT INTO patients
        (full_name, date_of_birth, sex, phone, email, address,
         insurance_provider, insurance_policy, medical_alerts, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
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
    )

  const patient = db
    .prepare(`${SELECT_PATIENT} WHERE id = ?`)
    .get(result.lastInsertRowid) as Patient | undefined

  if (!patient) {
    throw new Error(`Failed to retrieve patient after insert (rowid ${result.lastInsertRowid})`)
  }
  return patient
}

export function updatePatient(
  db: Database,
  id: number,
  data: UpdatePatientRequest
): Patient | undefined {
  const columnMap: Record<string, keyof UpdatePatientRequest> = {
    full_name: 'fullName',
    date_of_birth: 'dateOfBirth',
    sex: 'sex',
    phone: 'phone',
    email: 'email',
    address: 'address',
    insurance_provider: 'insuranceProvider',
    insurance_policy: 'insurancePolicy',
    medical_alerts: 'medicalAlerts',
    notes: 'notes'
  }

  const setClauses: string[] = []
  const values: unknown[] = []

  for (const [col, field] of Object.entries(columnMap)) {
    if (data[field] !== undefined) {
      setClauses.push(`${col} = ?`)
      values.push(data[field] ?? null)
    }
  }

  if (setClauses.length === 0) {
    return getPatient(db, id)
  }

  setClauses.push(`updated_at = datetime('now')`)
  values.push(id)

  db.prepare(`UPDATE patients SET ${setClauses.join(', ')} WHERE id = ?`).run(...values)

  return getPatient(db, id)
}

export function archivePatient(db: Database, id: number): void {
  db.prepare(`UPDATE patients SET archived_at = datetime('now') WHERE id = ?`).run(id)
}
