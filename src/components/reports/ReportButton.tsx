import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { Patient, ToothChartEntry, Treatment } from '@shared/types'
import { PatientReport } from '@/components/reports/PatientReport'
import { InvoicePdf } from '@/components/reports/InvoicePdf'
import { TreatmentPlanPdf } from '@/components/reports/TreatmentPlanPdf'
import { getClinicSettings } from '@/lib/ipc'
import { useTranslation } from '@/lib/i18n'

export interface ReportButtonProps {
  patient: Patient
  chartEntries: ToothChartEntry[]
  treatments: Treatment[]
}

type GenerationState =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'error'; message: string }

// ── Shared helpers ─────────────────────────────────────────────────────────────

function safeName(fullName: string): string {
  return fullName.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-')
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ── Spinner icon ───────────────────────────────────────────────────────────────

function SpinnerIcon(): JSX.Element {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── Download icon ──────────────────────────────────────────────────────────────

function DownloadIcon(): JSX.Element {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ── PdfButton ──────────────────────────────────────────────────────────────────

interface PdfButtonProps {
  label: string
  ariaLabel: string
  disabled: boolean
  state: GenerationState
  onClick: () => void
}

function PdfButton({ label, ariaLabel, disabled, state, onClick }: PdfButtonProps): JSX.Element {
  const isGenerating = state.kind === 'generating'
  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isGenerating}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 font-medium text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={ariaLabel}
      >
        {isGenerating ? <SpinnerIcon /> : <DownloadIcon />}
        {label}
      </button>
      {state.kind === 'error' && (
        <p className="text-xs text-red-600" role="alert">
          {state.message}
        </p>
      )}
    </div>
  )
}

// ── ReportButton ───────────────────────────────────────────────────────────────

export function ReportButton({ patient, chartEntries, treatments }: ReportButtonProps): JSX.Element {
  const t = useTranslation()

  const [invoiceState, setInvoiceState] = useState<GenerationState>({ kind: 'idle' })
  const [planState, setPlanState] = useState<GenerationState>({ kind: 'idle' })
  const [reportState, setReportState] = useState<GenerationState>({ kind: 'idle' })

  const [planNotesModalOpen, setPlanNotesModalOpen] = useState(false)
  const [planNotesText, setPlanNotesText] = useState('')

  const completedWithPrice = treatments.filter(
    (tx) => tx.status === 'completed' && tx.price != null
  )
  const plannedTreatments = treatments.filter((tx) => tx.status === 'planned')

  // ── Invoice ──

  async function handleInvoice(): Promise<void> {
    setInvoiceState({ kind: 'generating' })
    try {
      const clinic = await getClinicSettings()
      const dateStr = todayStr()
      const invoiceNumber = `INV-${dateStr.replace(/-/g, '')}-${patient.id}`
      const blob = await pdf(
        <InvoicePdf
          patient={patient}
          treatments={completedWithPrice}
          clinic={clinic}
          invoiceNumber={invoiceNumber}
        />
      ).toBlob()
      downloadBlob(blob, `invoice-${safeName(patient.fullName)}-${dateStr}.pdf`)
      setInvoiceState({ kind: 'idle' })
    } catch (err) {
      setInvoiceState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate invoice',
      })
    }
  }

  // ── Treatment Plan ──

  async function handlePlanGenerate(notes: string): Promise<void> {
    setPlanNotesModalOpen(false)
    setPlanState({ kind: 'generating' })
    try {
      const clinic = await getClinicSettings()
      const dateStr = todayStr()
      const blob = await pdf(
        <TreatmentPlanPdf
          patient={patient}
          treatments={plannedTreatments}
          clinic={clinic}
          doctorNotes={notes || undefined}
        />
      ).toBlob()
      downloadBlob(blob, `treatment-plan-${safeName(patient.fullName)}-${dateStr}.pdf`)
      setPlanState({ kind: 'idle' })
    } catch (err) {
      setPlanState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate treatment plan',
      })
    }
  }

  function handlePlanButtonClick(): void {
    setPlanNotesText('')
    setPlanNotesModalOpen(true)
  }

  // ── Patient Report ──

  async function handleReport(): Promise<void> {
    setReportState({ kind: 'generating' })
    try {
      const blob = await pdf(
        <PatientReport
          patient={patient}
          chartEntries={chartEntries}
          treatments={treatments}
        />
      ).toBlob()
      const dateStr = todayStr()
      downloadBlob(blob, `patient-report-${safeName(patient.fullName)}-${dateStr}.pdf`)
      setReportState({ kind: 'idle' })
    } catch (err) {
      setReportState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate PDF',
      })
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <PdfButton
          label={t.invoice}
          ariaLabel={`Export invoice for ${patient.fullName}`}
          disabled={completedWithPrice.length === 0}
          state={invoiceState}
          onClick={() => void handleInvoice()}
        />
        <PdfButton
          label={t.treatmentPlan}
          ariaLabel={`Export treatment plan for ${patient.fullName}`}
          disabled={plannedTreatments.length === 0}
          state={planState}
          onClick={handlePlanButtonClick}
        />
        <PdfButton
          label={t.exportPdf}
          ariaLabel={`Export PDF report for ${patient.fullName}`}
          disabled={false}
          state={reportState}
          onClick={() => void handleReport()}
        />
      </div>

      {/* ── Treatment Plan Notes modal ── */}
      {planNotesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-notes-modal-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2
              id="plan-notes-modal-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4"
            >
              {t.treatmentPlanNotes}
            </h2>

            <label
              htmlFor="plan-notes-textarea"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t.doctorNotesLabel}
            </label>
            <textarea
              id="plan-notes-textarea"
              rows={4}
              value={planNotesText}
              onChange={(e) => setPlanNotesText(e.target.value)}
              placeholder="Add any notes to include in the treatment plan PDF…"
              className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPlanNotesModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handlePlanGenerate(planNotesText)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {t.generatePdf}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
