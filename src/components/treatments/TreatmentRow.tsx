import type { Treatment } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'

interface TreatmentRowProps {
  treatment: Treatment
}

const STATUS_BADGE: Record<Treatment['status'], string> = {
  planned: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  referred: 'bg-blue-100 text-blue-800',
}

function formatDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00') // force local time parse
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatPrice(price: number | null): string {
  if (price === null) return '\u2014'
  return `$${price.toFixed(2)}`
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export function TreatmentRow({ treatment }: TreatmentRowProps): JSX.Element {
  const config = CONDITION_CONFIG[treatment.conditionType]
  const statusClass = STATUS_BADGE[treatment.status]

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      {/* Date */}
      <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5 font-mono">
        {formatDate(treatment.datePerformed)}
      </span>

      {/* Tooth FDI */}
      <span className="text-xs font-medium text-gray-700 w-10 shrink-0 pt-0.5">
        {treatment.toothFdi}
      </span>

      {/* Surface */}
      <span className="text-xs text-gray-500 w-16 shrink-0 pt-0.5 capitalize">
        {treatment.surface ?? <span className="text-gray-300">&mdash;</span>}
      </span>

      {/* Condition with swatch */}
      <span className="flex items-center gap-1.5 min-w-0 shrink-0 pt-0.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: config.svgFill }}
          aria-hidden="true"
        />
        <span className="text-xs text-gray-700">{config.label}</span>
      </span>

      {/* Status badge */}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusClass}`}
      >
        {treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1)}
      </span>

      {/* Performed by */}
      {treatment.performedBy && (
        <span className="text-xs text-gray-400 shrink-0 pt-0.5 hidden sm:inline">
          {treatment.performedBy}
        </span>
      )}

      {/* Notes */}
      {treatment.notes && (
        <span
          className="text-xs text-gray-400 min-w-0 truncate pt-0.5 flex-1"
          title={treatment.notes}
        >
          {truncate(treatment.notes, 60)}
        </span>
      )}

      {/* Price — right-aligned */}
      <span className="text-xs font-medium text-gray-700 ml-auto shrink-0 pt-0.5 tabular-nums">
        {formatPrice(treatment.price)}
      </span>
    </div>
  )
}
