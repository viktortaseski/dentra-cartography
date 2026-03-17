import type { ToothCondition, ToothSurface } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { useChartStore } from '@/store/chartStore'

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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2
            id="condition-picker-title"
            className="text-sm font-semibold text-gray-900"
          >
            Tooth {toothFdi} &mdash; {surfaceDisplayName(surface)}
          </h2>
          <button
            type="button"
            onClick={closeConditionPicker}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                  aria-label={`Set condition to ${config.label}`}
                  aria-pressed={isActive}
                  title={config.description}
                  className={[
                    'flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isActive
                      ? 'bg-blue-50 ring-2 ring-blue-500'
                      : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  {/* Color swatch */}
                  <span
                    className="w-7 h-7 rounded"
                    style={{ backgroundColor: config.svgFill }}
                    aria-hidden="true"
                  />
                  {/* Label */}
                  <span className="text-xs text-gray-700 leading-tight">
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={closeConditionPicker}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
