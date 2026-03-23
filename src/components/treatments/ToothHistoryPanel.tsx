import type { Treatment } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { useTranslation } from '@/lib/i18n'

interface ToothHistoryPanelProps {
  toothFdi: number
  treatments: Treatment[]
}

const STATUS_BADGE: Record<Treatment['status'], string> = {
  planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  referred: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

function formatDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function TreatmentCard({ treatment }: { treatment: Treatment }): JSX.Element {
  const t = useTranslation()
  const config = CONDITION_CONFIG[treatment.conditionType]
  const statusClass = STATUS_BADGE[treatment.status]
  const statusLabel =
    treatment.status === 'planned'
      ? t.statusPlanned
      : treatment.status === 'completed'
      ? t.statusCompleted
      : t.statusReferred

  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Date + status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
          {formatDate(treatment.datePerformed)}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Condition with color swatch */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: config.svgFill }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
          {t.conditions[treatment.conditionType]}
        </span>
        {treatment.surface && (
          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
            · {treatment.surface}
          </span>
        )}
      </div>

      {/* Performed by */}
      {treatment.performedBy && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
          {treatment.performedBy}
        </p>
      )}

      {/* Notes */}
      {treatment.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {treatment.notes}
        </p>
      )}

      {/* Price */}
      {treatment.price !== null && (
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1 tabular-nums">
          ${treatment.price.toFixed(2)}
        </p>
      )}
    </div>
  )
}

export function ToothHistoryPanel({ toothFdi, treatments }: ToothHistoryPanelProps): JSX.Element {
  const t = useTranslation()

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t.tooth} {toothFdi}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.treatmentHistory}</p>
      </div>

      {/* Treatment list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {treatments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
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
            <p className="text-xs text-gray-400 dark:text-gray-500">{t.noTreatments}</p>
          </div>
        ) : (
          <div role="list">
            {treatments.map((tr) => (
              <div key={tr.id} role="listitem">
                <TreatmentCard treatment={tr} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
