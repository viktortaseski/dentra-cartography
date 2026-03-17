import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { Patient, ToothChartEntry, Treatment } from '@shared/types'
import { PatientReport } from '@/components/reports/PatientReport'
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

export function ReportButton({ patient, chartEntries, treatments }: ReportButtonProps): JSX.Element {
  const t = useTranslation()
  const [state, setState] = useState<GenerationState>({ kind: 'idle' })

  async function handleExport(): Promise<void> {
    setState({ kind: 'generating' })
    try {
      const blob = await pdf(
        <PatientReport
          patient={patient}
          chartEntries={chartEntries}
          treatments={treatments}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const dateStr = new Date().toISOString().split('T')[0]
      // Sanitise the patient name for use in a filename
      const safeName = patient.fullName.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-')
      const filename = `patient-report-${safeName}-${dateStr}.pdf`

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()

      // Revoke the object URL after a short delay to allow the download to start
      setTimeout(() => URL.revokeObjectURL(url), 10_000)

      setState({ kind: 'idle' })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate PDF',
      })
    }
  }

  const isGenerating = state.kind === 'generating'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={isGenerating}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Export PDF report for ${patient.fullName}`}
      >
        {isGenerating ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
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
            {t.generating}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            {t.exportPdf}
          </>
        )}
      </button>
      {state.kind === 'error' && (
        <p className="text-xs text-red-600" role="alert">
          {state.message}
        </p>
      )}
    </div>
  )
}
