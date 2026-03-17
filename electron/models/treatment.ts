import type { Database } from 'better-sqlite3'
import type { Treatment, AddTreatmentRequest } from '@shared/types'

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
`

export function listTreatmentsForPatient(db: Database, patientId: number): Treatment[] {
  return db
    .prepare(`${SELECT_TREATMENT} WHERE patient_id = ? ORDER BY date_performed DESC`)
    .all(patientId) as Treatment[]
}

export function listTreatmentsForTooth(
  db: Database,
  patientId: number,
  toothFdi: number
): Treatment[] {
  return db
    .prepare(
      `${SELECT_TREATMENT} WHERE patient_id = ? AND tooth_fdi = ? ORDER BY date_performed DESC`
    )
    .all(patientId, toothFdi) as Treatment[]
}

export function addTreatment(db: Database, data: AddTreatmentRequest): Treatment {
  const result = db
    .prepare(
      `INSERT INTO treatments
        (patient_id, tooth_fdi, surface, condition_type, status, date_performed, performed_by, notes, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.patientId,
      data.toothFdi,
      data.surface ?? null,
      data.conditionType,
      data.status,
      data.datePerformed,
      data.performedBy ?? null,
      data.notes ?? null,
      data.price ?? null
    )

  const treatment = db
    .prepare(`${SELECT_TREATMENT} WHERE id = ?`)
    .get(result.lastInsertRowid) as Treatment | undefined

  if (!treatment) {
    throw new Error(`Failed to retrieve treatment after insert (rowid ${result.lastInsertRowid})`)
  }
  return treatment
}
