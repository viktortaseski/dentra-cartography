import { useState } from 'react'
import type { Treatment } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { useTranslation } from '@/lib/i18n'

interface TreatmentRowProps {
  treatment: Treatment
  onEditNotes?: (id: number, notes: string | null, price: number | null) => Promise<void>
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

function PencilIcon(): JSX.Element {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

function SpinnerIcon(): JSX.Element {
  return (
    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function TreatmentRow({ treatment, onEditNotes }: TreatmentRowProps): JSX.Element {
  const t = useTranslation()
  const config = CONDITION_CONFIG[treatment.conditionType]
  const statusClass = STATUS_BADGE[treatment.status]

  const [editMode, setEditMode] = useState(false)
  const [notesValue, setNotesValue] = useState(treatment.notes ?? '')
  const [priceValue, setPriceValue] = useState<string>(
    treatment.price !== null ? String(treatment.price) : ''
  )
  const [saving, setSaving] = useState(false)

  const canEdit = onEditNotes !== undefined && treatment.status === 'planned'

  const statusLabel =
    treatment.status === 'planned'
      ? t.statusPlanned
      : treatment.status === 'completed'
      ? t.statusCompleted
      : t.statusReferred

  function handleEditClick(): void {
    setNotesValue(treatment.notes ?? '')
    setPriceValue(treatment.price !== null ? String(treatment.price) : '')
    setEditMode(true)
  }

  function handleCancel(): void {
    setEditMode(false)
  }

  async function handleSave(): Promise<void> {
    if (!onEditNotes) return
    setSaving(true)
    try {
      const parsedPrice = priceValue.trim() !== '' ? parseFloat(priceValue) : null
      await onEditNotes(treatment.id, notesValue.trim() || null, parsedPrice)
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  if (editMode && canEdit) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 bg-blue-50 dark:bg-blue-900/10">
        {/* Top row: identity info stays visible */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 font-mono">
            {formatDate(treatment.datePerformed)}
          </span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 shrink-0">
            {treatment.toothFdi}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0 capitalize">
            {treatment.surface ?? <span className="text-gray-300 dark:text-gray-600">&mdash;</span>}
          </span>
          <span className="flex items-center gap-1.5 min-w-0 shrink-0">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: config.svgFill }}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {t.conditions[treatment.conditionType]}
            </span>
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Edit fields */}
        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Notes"
            className="flex-1 text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Treatment notes"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            placeholder={t.estPrice}
            className="w-28 text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Estimated price"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <SpinnerIcon />}
            {t.saveNotes}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50"
          >
            {t.cancelEdit}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* Date */}
      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 pt-0.5 font-mono">
        {formatDate(treatment.datePerformed)}
      </span>

      {/* Tooth FDI */}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 shrink-0 pt-0.5">
        {treatment.toothFdi}
      </span>

      {/* Surface */}
      <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0 pt-0.5 capitalize">
        {treatment.surface ?? <span className="text-gray-300 dark:text-gray-600">&mdash;</span>}
      </span>

      {/* Condition with swatch */}
      <span className="flex items-center gap-1.5 min-w-0 shrink-0 pt-0.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: config.svgFill }}
          aria-hidden="true"
        />
        <span className="text-xs text-gray-700 dark:text-gray-300">
          {t.conditions[treatment.conditionType]}
        </span>
      </span>

      {/* Status badge */}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusClass}`}
      >
        {statusLabel}
      </span>

      {/* Performed by */}
      {treatment.performedBy && (
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 pt-0.5 hidden sm:inline">
          {treatment.performedBy}
        </span>
      )}

      {/* Notes */}
      {treatment.notes && (
        <span
          className="text-xs text-gray-400 dark:text-gray-500 min-w-0 truncate pt-0.5 flex-1"
          title={treatment.notes}
        >
          {truncate(treatment.notes, 60)}
        </span>
      )}

      {/* Edit pencil button — only for planned rows when handler is provided */}
      {canEdit && (
        <button
          type="button"
          onClick={handleEditClick}
          className="ml-auto shrink-0 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label={t.editNotesAria}
        >
          <PencilIcon />
        </button>
      )}

      {/* Price — right-aligned */}
      <span
        className={`text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0 pt-0.5 tabular-nums ${canEdit ? '' : 'ml-auto'}`}
      >
        {formatPrice(treatment.price)}
      </span>
    </div>
  )
}
