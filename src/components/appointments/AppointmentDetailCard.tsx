import { useState } from 'react'
import type { Appointment, AppointmentStatus, Patient } from '@shared/types'

interface AppointmentDetailCardProps {
  appointment: Appointment
  patient: Patient | undefined
  onClose: () => void
  onReschedule: (appointment: Appointment) => void
  onDelete: (id: number) => void
}

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-800',
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

export function AppointmentDetailCard({
  appointment,
  patient,
  onClose,
  onReschedule,
  onDelete,
}: AppointmentDetailCardProps): JSX.Element {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleDeleteConfirm(): void {
    onDelete(appointment.id)
    onClose()
  }

  function handleEmailPatient(): void {
    if (patient?.email) {
      window.open(`mailto:${patient.email}`)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appt-detail-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="appt-detail-title" className="text-base font-semibold text-gray-900">
            {appointment.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Appointment info */}
        <div className="px-6 py-4 space-y-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 w-14 shrink-0">Date</span>
            <span className="text-sm text-gray-900">{formatLongDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 w-14 shrink-0">Time</span>
            <span className="text-sm text-gray-900">
              {appointment.startTime} – {appointment.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 w-14 shrink-0">Status</span>
            <span
              className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                STATUS_BADGE[appointment.status],
              ].join(' ')}
            >
              {STATUS_LABEL[appointment.status]}
            </span>
          </div>
        </div>

        {/* Patient info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Patient
          </p>
          {patient ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{patient.fullName}</p>
              {patient.phone && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400 mr-1">Phone:</span>
                  {patient.phone}
                </p>
              )}
              {patient.email && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400 mr-1">Email:</span>
                  {patient.email}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Patient not found</p>
          )}
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          {/* Email button */}
          <button
            type="button"
            onClick={handleEmailPatient}
            disabled={!patient?.email}
            title={!patient?.email ? 'No email on file' : undefined}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Email Patient
          </button>

          <div className="flex items-center gap-2">
            {/* Reschedule button */}
            <button
              type="button"
              onClick={() => onReschedule(appointment)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Reschedule
            </button>

            {/* Delete button / confirmation */}
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600">Are you sure?</span>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
