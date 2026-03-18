import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, Treatment, ClinicSettings } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { getToothDefinition } from '@/lib/toothDefinitions'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TreatmentPlanPdfProps {
  patient: Patient
  treatments: Treatment[]   // already filtered to planned only — do NOT filter inside
  clinic: ClinicSettings
  doctorNotes?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  clinicName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    letterSpacing: 0.5,
  },
  clinicContact: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 2,
  },
  docLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  docDate: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'right',
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

  // Patient info
  patientName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  patientDetail: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  alertBox: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#b45309',
  },
  alertText: {
    fontSize: 8,
    color: '#b45309',
    fontFamily: 'Helvetica-Bold',
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
  tableCellRight: {
    fontSize: 8,
    color: '#111827',
    textAlign: 'right',
  },

  // Treatment plan column widths
  colTooth: { width: '18%' },
  colSurface: { width: '15%' },
  colProcedure: { width: '50%' },
  colEstPrice: { width: '17%' },

  // Totals row
  totalsRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderTopColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
  },
  totalsLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    flex: 1,
    textAlign: 'right',
    paddingRight: 6,
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    width: '17%',
    textAlign: 'right',
  },

  // Doctor notes
  doctorNotesBox: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#6b7280',
    marginTop: 2,
  },
  doctorNotesText: {
    fontSize: 8.5,
    color: '#374151',
    lineHeight: 1.5,
  },

  // Signature block
  signatureBlock: {
    marginTop: 30,
    marginBottom: 18,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 8,
  },
  signatureField: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 3,
    paddingBottom: 16,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: '#6b7280',
  },
  signatureNote: {
    fontSize: 7.5,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 6,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
})

// ── Document ───────────────────────────────────────────────────────────────────

export function TreatmentPlanPdf({ patient, treatments, clinic, doctorNotes }: TreatmentPlanPdfProps): JSX.Element {
  const today = todayIso()
  const estimatedTotal = treatments.reduce((sum, tx) => sum + (tx.price ?? 0), 0)
  const hasAnyPrice = treatments.some((tx) => tx.price != null)

  return (
    <Document title={`Treatment Plan — ${patient.fullName}`}>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <View style={styles.headerLeft}>
            <Text style={styles.clinicName}>{clinic.clinicName || 'DENTAL CARTOGRAPHY'}</Text>
            {clinic.clinicAddress ? (
              <Text style={styles.clinicContact}>{clinic.clinicAddress}</Text>
            ) : null}
            {clinic.clinicPhone ? (
              <Text style={styles.clinicContact}>{clinic.clinicPhone}</Text>
            ) : null}
            {clinic.clinicEmail ? (
              <Text style={styles.clinicContact}>{clinic.clinicEmail}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>TREATMENT PLAN</Text>
            <Text style={styles.docDate}>Date: {formatDate(today)}</Text>
          </View>
        </View>

        {/* ── Patient ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Patient</Text>
          <Text style={styles.patientName}>{patient.fullName}</Text>
          <Text style={styles.patientDetail}>DOB: {formatDate(patient.dateOfBirth)}</Text>
          {patient.medicalAlerts ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>Medical Alerts: {patient.medicalAlerts}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Planned Treatments ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Planned Treatments</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colTooth]}>Tooth</Text>
            <Text style={[styles.tableHeaderCell, styles.colSurface]}>Surface</Text>
            <Text style={[styles.tableHeaderCell, styles.colProcedure]}>Procedure</Text>
            <Text style={[styles.tableHeaderCell, styles.colEstPrice, { textAlign: 'right' }]}>Est. Price</Text>
          </View>

          {/* Table rows */}
          {treatments.map((tx, index) => {
            const def = getToothDefinition(tx.toothFdi)
            const toothLabel = def
              ? `${tx.toothFdi} (${def.shortName})`
              : String(tx.toothFdi)
            const procedureLabel = CONDITION_CONFIG[tx.conditionType].label
            return (
              <View
                key={tx.id}
                style={[styles.tableRow, index % 2 !== 0 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colTooth]}>{toothLabel}</Text>
                <Text style={[styles.tableCell, styles.colSurface]}>
                  {tx.surface ? capitalise(tx.surface) : '—'}
                </Text>
                <Text style={[styles.tableCell, styles.colProcedure]}>{procedureLabel}</Text>
                <Text style={[styles.tableCellRight, styles.colEstPrice]}>
                  {tx.price != null ? formatPrice(tx.price) : '—'}
                </Text>
              </View>
            )
          })}

          {/* Estimated total row — only shown when at least one price is present */}
          {hasAnyPrice ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Estimated Total</Text>
              <Text style={styles.totalsValue}>{formatPrice(estimatedTotal)}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Doctor's Notes ── */}
        {doctorNotes && doctorNotes.trim() !== '' ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Doctor's Notes</Text>
            <View style={styles.doctorNotesBox}>
              <Text style={styles.doctorNotesText}>{doctorNotes.trim()}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Signature Block ── */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Patient Signature</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
          <Text style={styles.signatureNote}>
            By signing, the patient acknowledges the proposed treatment plan.
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated: {formatDate(today)}</Text>
        </View>

      </Page>
    </Document>
  )
}
