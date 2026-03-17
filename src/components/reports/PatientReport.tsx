import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, ToothChartEntry, Treatment } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { getToothDefinition } from '@/lib/toothDefinitions'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PatientReportProps {
  patient: Patient
  chartEntries: ToothChartEntry[]
  treatments: Treatment[]
}

interface ChartRow {
  fdi: number
  toothName: string
  surface: string
  conditionLabel: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatSex(sex: Patient['sex']): string {
  switch (sex) {
    case 'male':   return 'Male'
    case 'female': return 'Female'
    case 'other':  return 'Other'
  }
}

function statusBadge(status: Treatment['status']): string {
  switch (status) {
    case 'planned':   return '(pending)'
    case 'completed': return '(done)'
    case 'referred':  return '(ref.)'
  }
}

function buildChartRows(chartEntries: ToothChartEntry[]): ChartRow[] {
  const rows: ChartRow[] = []

  for (const entry of chartEntries) {
    const def = getToothDefinition(entry.toothFdi)
    const toothName = def ? `${entry.toothFdi} — ${def.name}` : String(entry.toothFdi)

    for (const surfaceRecord of entry.surfaces) {
      if (surfaceRecord.condition === 'healthy') continue
      const conditionLabel = CONDITION_CONFIG[surfaceRecord.condition].label
      rows.push({
        fdi: entry.toothFdi,
        toothName,
        surface: capitalise(surfaceRecord.surface),
        conditionLabel,
      })
    }
  }

  rows.sort((a, b) => a.fdi - b.fdi)
  return rows
}

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function sortedTreatments(treatments: Treatment[]): Treatment[] {
  return [...treatments].sort(
    (a, b) => new Date(b.datePerformed).getTime() - new Date(a.datePerformed).getTime()
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    color: '#111827',
    backgroundColor: '#ffffff',
  },

  // Header
  headerBlock: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1d4ed8',
    paddingBottom: 10,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    letterSpacing: 0.5,
  },
  reportTitle: {
    fontSize: 11,
    color: '#374151',
    marginTop: 2,
  },
  generatedDate: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 3,
  },

  // Section
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: '#1d4ed8',
    paddingBottom: 3,
    marginBottom: 8,
  },

  // Patient info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: 3,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    width: 90,
    fontSize: 8,
  },
  infoValue: {
    flex: 1,
    color: '#111827',
    fontSize: 8,
  },
  infoRowFull: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 3,
  },

  // Tables
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 8,
    color: '#111827',
  },

  // Chart table column widths
  colChartTooth: { width: '45%' },
  colChartSurface: { width: '25%' },
  colChartCondition: { width: '30%' },

  // Treatment table column widths
  colTreatDate: { width: '12%' },
  colTreatTooth: { width: '14%' },
  colTreatSurface: { width: '10%' },
  colTreatProcedure: { width: '20%' },
  colTreatStatus: { width: '13%' },
  colTreatBy: { width: '13%' },
  colTreatNotes: { width: '18%' },

  emptyNotice: {
    fontSize: 8,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  statusText: {
    fontSize: 7.5,
    color: '#6b7280',
  },
})

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function InfoFieldFull({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.infoRowFull}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// ── Document ───────────────────────────────────────────────────────────────────

export function PatientReport({ patient, chartEntries, treatments }: PatientReportProps): JSX.Element {
  const generatedOn = formatDate(new Date().toISOString().split('T')[0])
  const chartRows = buildChartRows(chartEntries)
  const sortedTreatmentList = sortedTreatments(treatments)

  return (
    <Document title={`Patient Report — ${patient.fullName}`}>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <Text style={styles.appName}>DENTAL CARTOGRAPHY</Text>
          <Text style={styles.reportTitle}>Patient Report</Text>
          <Text style={styles.generatedDate}>Generated: {generatedOn}</Text>
        </View>

        {/* ── Patient Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Patient Information</Text>
          <View style={styles.infoGrid}>
            <InfoField label="Name" value={patient.fullName} />
            <InfoField label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
            <InfoField label="Sex" value={formatSex(patient.sex)} />
            <InfoField label="Phone" value={patient.phone ?? 'N/A'} />
            <InfoField label="Email" value={patient.email ?? 'N/A'} />
            <InfoField
              label="Insurance"
              value={
                patient.insuranceProvider
                  ? `${patient.insuranceProvider}${patient.insurancePolicy ? ` — ${patient.insurancePolicy}` : ''}`
                  : 'N/A'
              }
            />
          </View>
          <View style={{ marginTop: 2 }}>
            <InfoFieldFull
              label="Medical Alerts"
              value={patient.medicalAlerts ?? 'None'}
            />
            {patient.address && (
              <InfoFieldFull label="Address" value={patient.address} />
            )}
            {patient.notes && (
              <InfoFieldFull label="Notes" value={patient.notes} />
            )}
          </View>
        </View>

        {/* ── Dental Chart Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Dental Chart Summary</Text>
          {chartRows.length === 0 ? (
            <Text style={styles.emptyNotice}>No conditions recorded</Text>
          ) : (
            <View>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colChartTooth]}>Tooth</Text>
                <Text style={[styles.tableHeaderCell, styles.colChartSurface]}>Surface</Text>
                <Text style={[styles.tableHeaderCell, styles.colChartCondition]}>Condition</Text>
              </View>
              {/* Table rows */}
              {chartRows.map((row, index) => (
                <View
                  key={`chart-${row.fdi}-${row.surface}`}
                  style={[styles.tableRow, index % 2 !== 0 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colChartTooth]}>{row.toothName}</Text>
                  <Text style={[styles.tableCell, styles.colChartSurface]}>{row.surface}</Text>
                  <Text style={[styles.tableCell, styles.colChartCondition]}>{row.conditionLabel}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Treatment History ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Treatment History</Text>
          {sortedTreatmentList.length === 0 ? (
            <Text style={styles.emptyNotice}>No treatments recorded</Text>
          ) : (
            <View>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colTreatDate]}>Date</Text>
                <Text style={[styles.tableHeaderCell, styles.colTreatTooth]}>Tooth</Text>
                <Text style={[styles.tableHeaderCell, styles.colTreatSurface]}>Surface</Text>
                <Text style={[styles.tableHeaderCell, styles.colTreatProcedure]}>Procedure</Text>
                <Text style={[styles.tableHeaderCell, styles.colTreatStatus]}>Status</Text>
                <Text style={[styles.tableHeaderCell, styles.colTreatBy]}>By</Text>
                <Text style={[styles.tableHeaderCell, styles.colTreatNotes]}>Notes</Text>
              </View>
              {/* Table rows */}
              {sortedTreatmentList.map((tx, index) => {
                const def = getToothDefinition(tx.toothFdi)
                const toothLabel = def
                  ? `${tx.toothFdi} (${def.shortName})`
                  : String(tx.toothFdi)
                const conditionLabel = CONDITION_CONFIG[tx.conditionType].label
                return (
                  <View
                    key={tx.id}
                    style={[styles.tableRow, index % 2 !== 0 ? styles.tableRowAlt : {}]}
                  >
                    <Text style={[styles.tableCell, styles.colTreatDate]}>
                      {formatDate(tx.datePerformed)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTreatTooth]}>{toothLabel}</Text>
                    <Text style={[styles.tableCell, styles.colTreatSurface]}>
                      {tx.surface ? capitalise(tx.surface) : '—'}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTreatProcedure]}>{conditionLabel}</Text>
                    <Text style={[styles.tableCell, styles.colTreatStatus]}>
                      {capitalise(tx.status)}{' '}
                      <Text style={styles.statusText}>{statusBadge(tx.status)}</Text>
                    </Text>
                    <Text style={[styles.tableCell, styles.colTreatBy]}>
                      {tx.performedBy ?? '—'}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTreatNotes]}>
                      {tx.notes ?? '—'}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

      </Page>
    </Document>
  )
}
