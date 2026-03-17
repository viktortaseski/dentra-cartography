import { useState, type FormEvent, type ChangeEvent } from 'react'
import type {
  ToothSurface,
  ToothCondition,
  TreatmentStatus,
  AddTreatmentRequest,
} from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { useTreatmentStore } from '@/store/treatmentStore'

interface TreatmentFormProps {
  patientId: number
  initialToothFdi?: number
  initialSurface?: ToothSurface
  initialCondition?: ToothCondition
  onClose: () => void
  onSaved: () => void
}

interface FormFields {
  toothFdi: string
  surface: ToothSurface | ''
  conditionType: ToothCondition | ''
  status: TreatmentStatus
  datePerformed: string
  performedBy: string
  notes: string
  price: string
}

const SURFACES: ToothSurface[] = ['occlusal', 'mesial', 'distal', 'buccal', 'lingual', 'incisal']

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

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export function TreatmentForm({
  patientId,
  initialToothFdi,
  initialSurface,
  initialCondition,
  onClose,
  onSaved,
}: TreatmentFormProps): JSX.Element {
  const { addTreatment, isLoading, error } = useTreatmentStore()

  const [fields, setFields] = useState<FormFields>({
    toothFdi: initialToothFdi !== undefined ? String(initialToothFdi) : '',
    surface: initialSurface ?? '',
    conditionType: initialCondition ?? '',
    status: 'completed',
    datePerformed: todayIso(),
    performedBy: '',
    notes: '',
    price: '',
  })

  const [validationError, setValidationError] = useState<string | null>(null)

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setValidationError(null)

    const fdiNum = parseInt(fields.toothFdi, 10)
    if (!fields.toothFdi || isNaN(fdiNum)) {
      setValidationError('Tooth FDI number is required.')
      return
    }
    if (!fields.conditionType) {
      setValidationError('Condition / procedure is required.')
      return
    }
    if (!fields.datePerformed) {
      setValidationError('Date performed is required.')
      return
    }

    let price: number | null = null
    if (fields.price.trim() !== '') {
      const parsed = parseFloat(fields.price)
      if (isNaN(parsed) || parsed < 0) {
        setValidationError('Price must be a non-negative number.')
        return
      }
      price = parsed
    }

    const data: AddTreatmentRequest = {
      patientId,
      toothFdi: fdiNum,
      surface: fields.surface || null,
      conditionType: fields.conditionType,
      status: fields.status,
      datePerformed: fields.datePerformed,
      performedBy: fields.performedBy.trim() || null,
      notes: fields.notes.trim() || null,
      price,
    }

    await addTreatment(data)

    if (!useTreatmentStore.getState().error) {
      onSaved()
    }
  }

  const displayedError = validationError ?? error

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="treatment-form-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="treatment-form-title" className="text-base font-semibold text-gray-900">
            Add Treatment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close form"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {displayedError && (
              <p
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                role="alert"
              >
                {displayedError}
              </p>
            )}

            {/* Tooth FDI + Surface row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tf-toothFdi"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tooth (FDI) <span className="text-red-500">*</span>
                </label>
                <input
                  id="tf-toothFdi"
                  name="toothFdi"
                  type="number"
                  value={fields.toothFdi}
                  onChange={handleChange}
                  min={11}
                  max={85}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 36"
                />
              </div>

              <div>
                <label
                  htmlFor="tf-surface"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Surface
                </label>
                <select
                  id="tf-surface"
                  name="surface"
                  value={fields.surface}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Whole tooth</option>
                  {SURFACES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label
                htmlFor="tf-conditionType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Condition / Procedure <span className="text-red-500">*</span>
              </label>
              <select
                id="tf-conditionType"
                name="conditionType"
                value={fields.conditionType}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select condition…</option>
                {ALL_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_CONFIG[c].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status + Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tf-status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="tf-status"
                  name="status"
                  value={fields.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="completed">Completed</option>
                  <option value="planned">Planned</option>
                  <option value="referred">Referred</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="tf-datePerformed"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date Performed <span className="text-red-500">*</span>
                </label>
                <input
                  id="tf-datePerformed"
                  name="datePerformed"
                  type="date"
                  value={fields.datePerformed}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Performed by + Price row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tf-performedBy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Performed By
                </label>
                <input
                  id="tf-performedBy"
                  name="performedBy"
                  type="text"
                  value={fields.performedBy}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dr. Smith"
                />
              </div>

              <div>
                <label
                  htmlFor="tf-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="tf-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={fields.price}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="tf-notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <textarea
                id="tf-notes"
                name="notes"
                value={fields.notes}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Additional observations or notes…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isLoading ? 'Saving…' : 'Add Treatment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
