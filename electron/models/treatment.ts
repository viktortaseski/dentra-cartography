import type { Database } from 'better-sqlite3'
import type { Treatment, AddTreatmentRequest, UpdateTreatmentNotesRequest } from '@shared/types'

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
  const insertTreatment = db.prepare(
    `INSERT INTO treatments
      (patient_id, tooth_fdi, surface, condition_type, status, date_performed, performed_by, notes, price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const upsertCondition = db.prepare(
    `INSERT INTO tooth_conditions (patient_id, tooth_fdi, surface, condition)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(patient_id, tooth_fdi, surface) DO UPDATE SET condition = excluded.condition`
  )

  let treatment: Treatment | undefined

  db.transaction(() => {
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
    )

    treatment = db
      .prepare(`${SELECT_TREATMENT} WHERE id = ?`)
      .get(result.lastInsertRowid) as Treatment | undefined

    if (!treatment) {
      throw new Error(`Failed to retrieve treatment after insert (rowid ${result.lastInsertRowid})`)
    }

    // Update the visual chart — use the actual surface or fall back to 'occlusal'
    // so whole-tooth treatments (null surface) still appear on the canvas.
    const conditionSurface = data.surface ?? 'occlusal'
    upsertCondition.run(data.patientId, data.toothFdi, conditionSurface, data.conditionType)
  })()

  return treatment!
}

export function updateTreatmentNotes(
  db: Database,
  data: UpdateTreatmentNotesRequest
): Treatment {
  const result = db
    .prepare(
      `UPDATE treatments SET notes = ?, price = ? WHERE id = ? AND status = 'planned'`
    )
    .run(data.notes ?? null, data.price ?? null, data.id)

  if (result.changes === 0) {
    throw new Error('Treatment not found or not editable')
  }

  const treatment = db
    .prepare(`${SELECT_TREATMENT} WHERE id = ?`)
    .get(data.id) as Treatment | undefined

  if (!treatment) {
    throw new Error(`Failed to retrieve treatment after update (id ${data.id})`)
  }
  return treatment
}
