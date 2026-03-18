import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, Treatment, ClinicSettings } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { getToothDefinition } from '@/lib/toothDefinitions'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InvoicePdfProps {
  patient: Patient
  treatments: Treatment[]   // already filtered to completed + has price — do NOT filter inside
  clinic: ClinicSettings
  invoiceNumber: string
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
  invoiceLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  invoiceMeta: {
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
  billToName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  billToDetail: {
    fontSize: 8,
    color: '#6b7280',
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

  // Invoice table column widths
  colDate: { width: '15%' },
  colTooth: { width: '20%' },
  colProcedure: { width: '50%' },
  colPrice: { width: '15%' },

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
    width: '15%',
    textAlign: 'right',
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

export function InvoicePdf({ patient, treatments, clinic, invoiceNumber }: InvoicePdfProps): JSX.Element {
  const today = todayIso()
  const total = treatments.reduce((sum, tx) => sum + (tx.price ?? 0), 0)

  return (
    <Document title={`Invoice ${invoiceNumber} — ${patient.fullName}`}>
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
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceMeta}># {invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Date: {formatDate(today)}</Text>
          </View>
        </View>

        {/* ── Bill To ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Bill To</Text>
          <Text style={styles.billToName}>{patient.fullName}</Text>
          <Text style={styles.billToDetail}>DOB: {formatDate(patient.dateOfBirth)}</Text>
        </View>

        {/* ── Line Items ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Services</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colTooth]}>Tooth</Text>
            <Text style={[styles.tableHeaderCell, styles.colProcedure]}>Procedure</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice, { textAlign: 'right' }]}>Price</Text>
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
                <Text style={[styles.tableCell, styles.colDate]}>
                  {formatDate(tx.datePerformed)}
                </Text>
                <Text style={[styles.tableCell, styles.colTooth]}>{toothLabel}</Text>
                <Text style={[styles.tableCell, styles.colProcedure]}>{procedureLabel}</Text>
                <Text style={[styles.tableCellRight, styles.colPrice]}>
                  {formatPrice(tx.price ?? 0)}
                </Text>
              </View>
            )
          })}

          {/* Totals row */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total</Text>
            <Text style={styles.totalsValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing {clinic.clinicName || 'our clinic'}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
