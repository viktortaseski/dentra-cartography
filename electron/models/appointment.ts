import { getDb } from '../db/connection'
import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '@shared/types'

// DB row shape (snake_case columns from SQLite)
interface AppointmentRow {
  id: number
  patient_id: number
  title: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

function rowToAppointment(row: AppointmentRow): Appointment {
  return {
    id:        row.id,
    patientId: row.patient_id,
    title:     row.title,
    date:      row.date,
    startTime: row.start_time,
    endTime:   row.end_time,
    status:    row.status as Appointment['status'],
    notes:     row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
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
`

/**
 * If date is provided, return appointments for that date.
 * Otherwise return all appointments where date >= today, ordered by date ASC, start_time ASC.
 */
export function listAppointments(date?: string): Appointment[] {
  const db = getDb()
  if (date !== undefined) {
    const rows = db
      .prepare(`${SELECT_APPOINTMENT} WHERE date = ? ORDER BY start_time ASC`)
      .all(date) as AppointmentRow[]
    return rows.map(rowToAppointment)
  }
  const today = new Date().toISOString().slice(0, 10)
  const rows = db
    .prepare(`${SELECT_APPOINTMENT} WHERE date >= ? ORDER BY date ASC, start_time ASC`)
    .all(today) as AppointmentRow[]
  return rows.map(rowToAppointment)
}

/**
 * All appointments for a patient, newest date first.
 */
export function listAppointmentsForPatient(patientId: number): Appointment[] {
  const db = getDb()
  const rows = db
    .prepare(`${SELECT_APPOINTMENT} WHERE patient_id = ? ORDER BY date DESC, start_time DESC`)
    .all(patientId) as AppointmentRow[]
  return rows.map(rowToAppointment)
}

export function createAppointment(data: CreateAppointmentRequest): Appointment {
  const db = getDb()
  const result = db
    .prepare(
      `INSERT INTO appointments
        (patient_id, title, date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.patientId,
      data.title,
      data.date,
      data.startTime,
      data.endTime,
      data.status,
      data.notes ?? null
    )

  const row = db
    .prepare(`${SELECT_APPOINTMENT} WHERE id = ?`)
    .get(result.lastInsertRowid) as AppointmentRow | undefined

  if (!row) {
    throw new Error(
      `Failed to retrieve appointment after insert (rowid ${result.lastInsertRowid})`
    )
  }
  return rowToAppointment(row)
}

export function updateAppointment(
  id: number,
  data: UpdateAppointmentRequest
): Appointment | undefined {
  const db = getDb()

  // Build SET clause dynamically from provided fields only
  const setClauses: string[] = []
  const params: (string | number | null)[] = []

  if (data.patientId !== undefined) {
    setClauses.push('patient_id = ?')
    params.push(data.patientId)
  }
  if (data.title !== undefined) {
    setClauses.push('title = ?')
    params.push(data.title)
  }
  if (data.date !== undefined) {
    setClauses.push('date = ?')
    params.push(data.date)
  }
  if (data.startTime !== undefined) {
    setClauses.push('start_time = ?')
    params.push(data.startTime)
  }
  if (data.endTime !== undefined) {
    setClauses.push('end_time = ?')
    params.push(data.endTime)
  }
  if (data.status !== undefined) {
    setClauses.push('status = ?')
    params.push(data.status)
  }
  if ('notes' in data) {
    setClauses.push('notes = ?')
    params.push(data.notes ?? null)
  }

  if (setClauses.length === 0) {
    // Nothing to update — return the existing record
    const row = db
      .prepare(`${SELECT_APPOINTMENT} WHERE id = ?`)
      .get(id) as AppointmentRow | undefined
    return row ? rowToAppointment(row) : undefined
  }

  setClauses.push("updated_at = datetime('now')")
  params.push(id)

  db.prepare(`UPDATE appointments SET ${setClauses.join(', ')} WHERE id = ?`).run(...params)

  const updated = db
    .prepare(`${SELECT_APPOINTMENT} WHERE id = ?`)
    .get(id) as AppointmentRow | undefined

  return updated ? rowToAppointment(updated) : undefined
}

export function deleteAppointment(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(id)
  return result.changes > 0
}
