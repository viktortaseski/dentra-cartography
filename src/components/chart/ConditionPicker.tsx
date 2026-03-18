import { useState, useEffect } from 'react'
import type { ToothCondition, ToothSurface } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { useChartStore } from '@/store/chartStore'
import { useTranslation } from '@/lib/i18n'
import { getToothNote, setToothNote } from '@/lib/ipc'

// All 12 conditions in a stable display order
const ALL_CONDITIONS: ToothCondition[] = [
  'healthy',
  'caries',
  'filling_amalgam',
  'filling_composite',
  'crown',
  'extraction',
  'missing_congenital',
  'implant',
  'root_canal',
  'bridge_pontic',
  'fracture',
  'watch',
]

function surfaceDisplayName(surface: ToothSurface): string {
  return surface.charAt(0).toUpperCase() + surface.slice(1)
}

export function ConditionPicker(): JSX.Element {
  const t = useTranslation()
  const {
    selectedToothFdi,
    selectedSurface,
    loadedPatientId,
    closeConditionPicker,
    setCondition,
    getCondition,
  } = useChartStore()

  // Guard: should not render when picker is closed, but keep types tight
  if (selectedToothFdi === null || selectedSurface === null || loadedPatientId === null) {
    return <></>
  }

  const toothFdi = selectedToothFdi
  const surface = selectedSurface
  const patientId = loadedPatientId

  const activeCondition = getCondition(toothFdi, surface)

  const [noteText, setNoteText] = useState('')
  const [originalNote, setOriginalNote] = useState('')
  const [noteLoading, setNoteLoading] = useState(true)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setNoteLoading(true)
    setNoteError(null)
    getToothNote(patientId, toothFdi)
      .then((note) => {
        if (!cancelled) {
          setNoteText(note)
          setOriginalNote(note)
          setNoteLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNoteError('Failed to load note')
          setNoteLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [patientId, toothFdi])

  async function handleSaveNote(): Promise<void> {
    setNoteSaving(true)
    setNoteError(null)
    try {
      await setToothNote(patientId, toothFdi, noteText)
      setOriginalNote(noteText)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 1500)
    } catch {
      setNoteError('Failed to save note')
    } finally {
      setNoteSaving(false)
    }
  }

  async function handleSelectCondition(condition: ToothCondition): Promise<void> {
    await setCondition({ patientId, toothFdi, surface, condition })
    closeConditionPicker()
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>): void {
    // Only close when clicking the backdrop itself, not the dialog content
    if (e.target === e.currentTarget) {
      closeConditionPicker()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Escape') {
      closeConditionPicker()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="condition-picker-title"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2
            id="condition-picker-title"
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            {t.tooth} {toothFdi} &mdash; {surfaceDisplayName(surface)}
          </h2>
          <button
            type="button"
            onClick={closeConditionPicker}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close condition picker"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Condition grid */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {ALL_CONDITIONS.map((condition) => {
              const config = CONDITION_CONFIG[condition]
              const isActive = condition === activeCondition
              return (
                <button
                  key={condition}
                  type="button"
                  onClick={() => void handleSelectCondition(condition)}
                  aria-label={`Set condition to ${t.conditions[condition]}`}
                  aria-pressed={isActive}
                  title={config.description}
                  className={[
                    'flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  {/* Color swatch — medically meaningful, stays the same in dark mode */}
                  <span
                    className="w-7 h-7 rounded"
                    style={{ backgroundColor: config.svgFill }}
                    aria-hidden="true"
                  />
                  {/* Label */}
                  <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                    {t.conditions[condition]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tooth Notes */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            {t.toothNotes}
          </p>
          {noteLoading ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t.loading}</p>
          ) : (
            <>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value)
                  setNoteSaved(false)
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={t.toothNotes}
              />
              {noteError !== null && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{noteError}</p>
              )}
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveNote()}
                  disabled={noteSaving || (noteText === originalNote && noteText === '')}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {noteSaving && (
                    <svg
                      className="w-3 h-3 animate-spin"
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
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {t.saveNote}
                </button>
                {noteSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {t.noteSaved} &#10003;
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={closeConditionPicker}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
