import { useEffect, useState, useMemo } from 'react'
import { useTreatmentStore } from '@/store/treatmentStore'
import { useChartStore } from '@/store/chartStore'
import { TreatmentRow } from './TreatmentRow'
import { TreatmentForm } from './TreatmentForm'
import { useTranslation } from '@/lib/i18n'
import type { ToothSurface, ToothCondition } from '@shared/types'

interface TreatmentPanelProps {
  patientId: number
  selectedToothFdi: number | null
}

export function TreatmentPanel({ patientId, selectedToothFdi }: TreatmentPanelProps): JSX.Element {
  const t = useTranslation()
  const { treatments, isLoading, error, loadTreatmentsForPatient } = useTreatmentStore()
  const { selectedSurface, getCondition } = useChartStore()

  const [formOpen, setFormOpen] = useState(false)
  const [panelHeight, setPanelHeight] = useState(192)

  function handleResizeMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = panelHeight

    function onMouseMove(ev: MouseEvent): void {
      const delta = startY - ev.clientY
      setPanelHeight(Math.max(96, Math.min(600, startHeight + delta)))
    }

    function onMouseUp(): void {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Load all treatments for the patient whenever patientId changes
  useEffect(() => {
    void loadTreatmentsForPatient(patientId)
  }, [patientId, loadTreatmentsForPatient])

  // Filter client-side when a tooth is selected
  const displayedTreatments = useMemo(() => {
    if (selectedToothFdi === null) return treatments
    return treatments.filter((tr) => tr.toothFdi === selectedToothFdi)
  }, [treatments, selectedToothFdi])

  // Pre-fill form from chart selection when available
  const formInitialSurface: ToothSurface | undefined =
    selectedSurface !== null ? selectedSurface : undefined

  const formInitialCondition: ToothCondition | undefined =
    selectedToothFdi !== null && selectedSurface !== null
      ? getCondition(selectedToothFdi, selectedSurface)
      : undefined

  function handleSaved(): void {
    setFormOpen(false)
    void loadTreatmentsForPatient(patientId)
  }

  return (
    <div
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col flex-shrink-0 overflow-y-auto"
      style={{ height: panelHeight }}
    >
      {/* Resize handle — drag upward to expand */}
      <div
        className="w-full flex-shrink-0 flex items-center justify-center h-3 cursor-ns-resize group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onMouseDown={handleResizeMouseDown}
        aria-hidden="true"
      >
        <div className="w-8 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.treatmentHistory}</h2>

          {/* All Teeth / Tooth {fdi} filter indicator */}
          {selectedToothFdi !== null ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              {t.tooth} {selectedToothFdi}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {t.allTeeth}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Add treatment"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          {t.addTreatment}
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0">
          Date
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-10 shrink-0">
          {t.tooth}
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16 shrink-0">
          {t.surface}
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
          {t.procedure}
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0 ml-1">
          {t.status}
        </span>
      </div>

      {/* Body */}
      <div>
        {/* Loading */}
        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-6 text-center" aria-live="polite">
            {t.loading}
          </p>
        )}

        {/* Error */}
        {!isLoading && error && (
          <p
            className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mx-4 my-3 px-3 py-2"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Empty state */}
        {!isLoading && !error && displayedTreatments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <svg
              className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.noTreatments}</p>
            {selectedToothFdi !== null && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">for tooth {selectedToothFdi}</p>
            )}
          </div>
        )}

        {/* Treatment rows */}
        {!isLoading && !error && displayedTreatments.length > 0 && (
          <div role="list" aria-label="Treatment history">
            {displayedTreatments.map((treatment) => (
              <div key={treatment.id} role="listitem">
                <TreatmentRow treatment={treatment} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Treatment modal */}
      {formOpen && (
        <TreatmentForm
          patientId={patientId}
          initialToothFdi={selectedToothFdi ?? undefined}
          initialSurface={formInitialSurface}
          initialCondition={formInitialCondition}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
