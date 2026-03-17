import { useState, type FormEvent, type ChangeEvent } from 'react'
import type {
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  Appointment,
} from '@shared/types'
import { usePatientStore } from '@/store/patientStore'
import { useAppointmentStore } from '@/store/appointmentStore'
import { useTranslation } from '@/lib/i18n'

interface AppointmentFormProps {
  /** Pass an existing appointment to edit, or undefined to create */
  appointment?: Appointment
  /** Pre-fill the date when opening from a calendar day click */
  initialDate?: string
  onClose: () => void
}

interface FormFields {
  patientId: string
  title: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function appointmentToFields(a: Appointment): FormFields {
  return {
    patientId: String(a.patientId),
    title: a.title,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    notes: a.notes ?? '',
  }
}

export function AppointmentForm({
  appointment,
  initialDate,
  onClose,
}: AppointmentFormProps): JSX.Element {
  const t = useTranslation()
  const patients = usePatientStore((s) => s.patients)
  const { createAppointment, updateAppointment, error } = useAppointmentStore()

  const [fields, setFields] = useState<FormFields>(
    appointment
      ? appointmentToFields(appointment)
      : {
          patientId: '',
          title: '',
          date: initialDate ?? todayIso(),
          startTime: '09:00',
          endTime: '09:30',
          status: 'scheduled',
          notes: '',
        }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
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

    const patientIdNum = parseInt(fields.patientId, 10)
    if (!fields.patientId || isNaN(patientIdNum)) {
      setValidationError('Please select a patient.')
      return
    }
    if (!fields.title.trim()) {
      setValidationError('Title is required.')
      return
    }
    if (!fields.date) {
      setValidationError('Date is required.')
      return
    }
    if (!fields.startTime) {
      setValidationError('Start time is required.')
      return
    }
    if (!fields.endTime) {
      setValidationError('End time is required.')
      return
    }
    if (fields.endTime <= fields.startTime) {
      setValidationError('End time must be after start time.')
      return
    }

    setIsSubmitting(true)
    try {
      if (appointment) {
        const data: UpdateAppointmentRequest = {
          patientId: patientIdNum,
          title: fields.title.trim(),
          date: fields.date,
          startTime: fields.startTime,
          endTime: fields.endTime,
          status: fields.status,
          notes: fields.notes.trim() || null,
        }
        await updateAppointment(appointment.id, data)
      } else {
        const data: CreateAppointmentRequest = {
          patientId: patientIdNum,
          title: fields.title.trim(),
          date: fields.date,
          startTime: fields.startTime,
          endTime: fields.endTime,
          status: fields.status,
          notes: fields.notes.trim() || null,
        }
        await createAppointment(data)
      }

      if (!useAppointmentStore.getState().error) {
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedError = validationError ?? error

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appt-form-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 id="appt-form-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {appointment ? t.reschedule : t.newAppointment}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close form"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {displayedError && (
              <p
                className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"
                role="alert"
              >
                {displayedError}
              </p>
            )}

            {/* Patient selector */}
            <div>
              <label htmlFor="af-patient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.patient} <span className="text-red-500">*</span>
              </label>
              <select
                id="af-patient"
                name="patientId"
                value={fields.patientId}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">{t.selectPatientLabel}…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="af-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.title} <span className="text-red-500">*</span>
              </label>
              <input
                id="af-title"
                name="title"
                type="text"
                value={fields.title}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Check-up, Extraction, Root canal…"
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="af-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.date} <span className="text-red-500">*</span>
              </label>
              <input
                id="af-date"
                name="date"
                type="date"
                value={fields.date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Start + End time row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="af-startTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t.startTime} <span className="text-red-500">*</span>
                </label>
                <input
                  id="af-startTime"
                  name="startTime"
                  type="time"
                  value={fields.startTime}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="af-endTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t.endTime} <span className="text-red-500">*</span>
                </label>
                <input
                  id="af-endTime"
                  name="endTime"
                  type="time"
                  value={fields.endTime}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="af-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.status}
              </label>
              <select
                id="af-status"
                name="status"
                value={fields.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="scheduled">{t.appointmentStatusScheduled}</option>
                <option value="completed">{t.appointmentStatusCompleted}</option>
                <option value="cancelled">{t.appointmentStatusCancelled}</option>
                <option value="no_show">{t.appointmentStatusNoShow}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="af-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.notes}
              </label>
              <textarea
                id="af-notes"
                name="notes"
                value={fields.notes}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Additional notes…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isSubmitting ? t.saving : appointment ? t.save : t.newAppointment}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
