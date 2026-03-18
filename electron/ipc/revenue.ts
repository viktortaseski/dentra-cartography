import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import type { RevenueStats, RevenueTransaction } from '@shared/types'

interface RawTransactionRow {
  treatmentId: number
  patientId: number
  patientName: string
  conditionType: string
  toothFdi: number
  surface: string | null
  status: string
  datePerformed: string
  price: number
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
`

function currentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function computeStats(rows: RawTransactionRow[]): RevenueStats {
  const thisMonth = currentYearMonth()

  let totalEarned = 0
  let totalOutstanding = 0
  let earnedThisMonth = 0
  let outstandingThisMonth = 0

  const transactions: RevenueTransaction[] = []

  for (const row of rows) {
    const rowMonth = row.datePerformed.slice(0, 7) // YYYY-MM

    if (row.status === 'completed') {
      totalEarned += row.price
      if (rowMonth === thisMonth) {
        earnedThisMonth += row.price
      }
    } else if (row.status === 'planned') {
      totalOutstanding += row.price
      if (rowMonth === thisMonth) {
        outstandingThisMonth += row.price
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
      price: row.price,
    })
  }

  return {
    totalEarned,
    totalOutstanding,
    earnedThisMonth,
    outstandingThisMonth,
    transactions,
  }
}

export function registerRevenueHandlers(): void {
  ipcMain.handle('revenue:getStats', (): RevenueStats => {
    const db = getDb()
    const rows = db.prepare(TRANSACTION_SQL).all() as RawTransactionRow[]
    return computeStats(rows)
  })
}
