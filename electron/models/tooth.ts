import type { Database } from 'better-sqlite3'
import type { ToothChartEntry, SetToothConditionRequest } from '@shared/types'

export function getChartForPatient(db: Database, patientId: number): ToothChartEntry[] {
  const rows = db
    .prepare(
      `SELECT tooth_fdi AS toothFdi, surface, condition
       FROM tooth_conditions
       WHERE patient_id = ?
       ORDER BY tooth_fdi, surface`
    )
    .all(patientId) as { toothFdi: number; surface: string; condition: string }[]

  const map = new Map<number, ToothChartEntry>()
  for (const row of rows) {
    if (!map.has(row.toothFdi)) {
      map.set(row.toothFdi, { toothFdi: row.toothFdi, surfaces: [] })
    }
    const entry = map.get(row.toothFdi)
    if (entry) {
      entry.surfaces.push({
        surface: row.surface as ToothChartEntry['surfaces'][0]['surface'],
        condition: row.condition as ToothChartEntry['surfaces'][0]['condition']
      })
    }
  }
  return Array.from(map.values())
}

export function setToothCondition(db: Database, data: SetToothConditionRequest): void {
  db.prepare(
    `INSERT INTO tooth_conditions (patient_id, tooth_fdi, surface, condition, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(patient_id, tooth_fdi, surface)
     DO UPDATE SET condition = excluded.condition, updated_at = excluded.updated_at`
  ).run(data.patientId, data.toothFdi, data.surface, data.condition)
}
