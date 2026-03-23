import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import type { CsvImportResult } from '@shared/types'

// ── CSV serialisation helpers ─────────────────────────────────────────────────

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(',')
}

// ── CSV parser (handles quoted fields and escaped double-quotes) ───────────────

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  return semicolonCount > commaCount ? ';' : ','
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    i++
  }
  fields.push(current)
  return fields
}

function parseCsv(content: string): string[][] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []
  const delimiter = detectDelimiter(lines[0])
  return lines.map((line) => parseCsvLine(line, delimiter))
}

// ── DB row types ──────────────────────────────────────────────────────────────

interface PatientRow {
  id: number
  full_name: string
  date_of_birth: string
  sex: string
  phone: string | null
  email: string | null
  address: string | null
  insurance_provider: string | null
  insurance_policy: string | null
  medical_alerts: string | null
  notes: string | null
}

interface TreatmentRow {
  tooth_fdi: number
  surface: string | null
  condition_type: string
  status: string
  date_performed: string
  performed_by: string | null
  notes: string | null
  price: number | null
}

// ── Handler registration ──────────────────────────────────────────────────────

export function registerCsvHandlers(): void {
  // ── Export ──────────────────────────────────────────────────────────────────
  ipcMain.handle('patients:exportCsv', (): string => {
    const db = getDb()

    const HEADER =
      'full_name,date_of_birth,sex,phone,email,address,insurance_provider,insurance_policy,medical_alerts,notes,tooth_fdi,surface,condition_type,treatment_status,date_performed,performed_by,treatment_notes,price'

    const patients = db
      .prepare('SELECT * FROM patients WHERE archived_at IS NULL ORDER BY full_name')
      .all() as PatientRow[]

    const rows: string[] = [HEADER]

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
        p.notes,
      ]

      const treatments = db
        .prepare('SELECT * FROM treatments WHERE patient_id = ? ORDER BY date_performed')
        .all(p.id) as TreatmentRow[]

      if (treatments.length === 0) {
        rows.push(toCsvRow([...patientFields, '', '', '', '', '', '', '', '']))
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
              t.price,
            ]),
          )
        }
      }
    }

    return rows.join('\n')
  })

  ipcMain.handle('patients:exportCsvSelected', (_event, ids: unknown): string => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return 'full_name,date_of_birth,sex,phone,email,address,insurance_provider,insurance_policy,medical_alerts,notes,tooth_fdi,surface,condition_type,treatment_status,date_performed,performed_by,treatment_notes,price'
    }

    const validIds = ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id))
    if (validIds.length === 0) {
      return 'full_name,date_of_birth,sex,phone,email,address,insurance_provider,insurance_policy,medical_alerts,notes,tooth_fdi,surface,condition_type,treatment_status,date_performed,performed_by,treatment_notes,price'
    }

    const db = getDb()

    const HEADER =
      'full_name,date_of_birth,sex,phone,email,address,insurance_provider,insurance_policy,medical_alerts,notes,tooth_fdi,surface,condition_type,treatment_status,date_performed,performed_by,treatment_notes,price'

    const placeholders = validIds.map(() => '?').join(',')
    const patients = db
      .prepare(`SELECT * FROM patients WHERE archived_at IS NULL AND id IN (${placeholders}) ORDER BY full_name`)
      .all(...validIds) as PatientRow[]

    const rows: string[] = [HEADER]

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
        p.notes,
      ]

      const treatments = db
        .prepare('SELECT * FROM treatments WHERE patient_id = ? ORDER BY date_performed')
        .all(p.id) as TreatmentRow[]

      if (treatments.length === 0) {
        rows.push(toCsvRow([...patientFields, '', '', '', '', '', '', '', '']))
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
              t.price,
            ]),
          )
        }
      }
    }

    return rows.join('\n')
  })

  // ── Import ──────────────────────────────────────────────────────────────────
  ipcMain.handle('patients:importCsv', (_event, csvContent: unknown): CsvImportResult => {
    if (typeof csvContent !== 'string') {
      return {
        patientsCreated: 0,
        patientsSkipped: 0,
        treatmentsAdded: 0,
        errors: ['Invalid input: expected a CSV string'],
      }
    }

    const db = getDb()
    const rows = parseCsv(csvContent)

    // Skip header row if present
    const dataRows =
      rows[0]?.[0]?.toLowerCase().trim() === 'full_name' ? rows.slice(1) : rows

    let patientsCreated = 0
    let patientsSkipped = 0
    let treatmentsAdded = 0
    const errors: string[] = []

    // Group rows by full_name + date_of_birth + sex so one patient = one block
    const patientGroups = new Map<string, string[][]>()
    for (const row of dataRows) {
      if (row.length < 3) continue
      const key = `${row[0]?.trim()}|${row[1]?.trim()}|${row[2]?.trim()}`
      const group = patientGroups.get(key)
      if (group) {
        group.push(row)
      } else {
        patientGroups.set(key, [row])
      }
    }

    const insertPatient = db.prepare(`
      INSERT INTO patients (full_name, date_of_birth, sex, phone, email, address,
        insurance_provider, insurance_policy, medical_alerts, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertTreatment = db.prepare(`
      INSERT INTO treatments (patient_id, tooth_fdi, surface, condition_type, status,
        date_performed, performed_by, notes, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const upsertCondition = db.prepare(`
      INSERT INTO tooth_conditions (patient_id, tooth_fdi, surface, condition)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(patient_id, tooth_fdi, surface) DO UPDATE SET condition = excluded.condition
    `)

    const findPatient = db.prepare(
      'SELECT id FROM patients WHERE full_name = ? AND date_of_birth = ? AND sex = ? AND archived_at IS NULL',
    )

    const importAll = db.transaction(() => {
      for (const [key, groupRows] of patientGroups) {
        const firstRow = groupRows[0]
        const fullName = firstRow[0]?.trim()
        const dob = firstRow[1]?.trim()
        const sex = firstRow[2]?.trim()

        if (!fullName || !dob || !sex) {
          errors.push(`Skipping row with missing required fields: ${key}`)
          continue
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
          errors.push(`Skipping "${fullName}": date_of_birth must be YYYY-MM-DD, got "${dob}"`)
          continue
        }

        // Validate sex value
        if (!['male', 'female', 'other'].includes(sex)) {
          errors.push(
            `Skipping "${fullName}": sex must be male/female/other, got "${sex}"`,
          )
          continue
        }

        // Check whether the patient already exists
        const existing = findPatient.get(fullName, dob, sex) as { id: number } | undefined

        let patientId: number
        if (existing) {
          patientId = existing.id
          patientsSkipped++
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
            firstRow[9]?.trim() || null,
          )
          patientId = Number(result.lastInsertRowid)
          patientsCreated++
        }

        // Insert treatments — rows are already ordered by date_performed (ascending)
        // so the last upsert to tooth_conditions is the most recent condition.
        for (const row of groupRows) {
          const toothFdiStr = row[10]?.trim()
          if (!toothFdiStr) continue

          const toothFdi = Number(toothFdiStr)
          if (!Number.isInteger(toothFdi) || toothFdi <= 0) {
            errors.push(
              `Treatment skipped for "${fullName}": invalid tooth_fdi "${toothFdiStr}"`,
            )
            continue
          }

          const surface = row[11]?.trim() || null
          const conditionType = row[12]?.trim()
          const status = row[13]?.trim()
          const datePerformed = row[14]?.trim()

          if (!conditionType || !status || !datePerformed) {
            errors.push(
              `Treatment skipped for "${fullName}": missing condition_type, status, or date_performed`,
            )
            continue
          }

          if (!/^\d{4}-\d{2}-\d{2}$/.test(datePerformed)) {
            errors.push(
              `Treatment skipped for "${fullName}": date_performed must be YYYY-MM-DD, got "${datePerformed}"`,
            )
            continue
          }

          const priceStr = row[17]?.trim()
          const price = priceStr ? Number(priceStr) : null
          if (price !== null && isNaN(price)) {
            errors.push(
              `Treatment skipped for "${fullName}": price is not a valid number "${priceStr}"`,
            )
            continue
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
              price,
            )
            treatmentsAdded++

            // Update tooth_conditions — separate write, separate concern
            if (surface) {
              upsertCondition.run(patientId, toothFdi, surface, conditionType)
            }
          } catch (err) {
            errors.push(
              `Treatment insert error for "${fullName}": ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }
      }
    })

    try {
      importAll()
    } catch (err) {
      errors.push(
        `Transaction failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    return { patientsCreated, patientsSkipped, treatmentsAdded, errors }
  })
}
