import type { Appointment, AppointmentStatus } from '@shared/types'

interface AppointmentBlockProps {
  appointment: Appointment
  patientName: string
  onClick: (appointment: Appointment) => void
}

const STATUS_ACCENT: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-400',
  no_show:   'bg-red-500',
}

const STATUS_TEXT: Record<AppointmentStatus, string> = {
  scheduled: '',
  completed: '',
  cancelled: 'line-through text-gray-400 dark:text-gray-500',
  no_show:   '',
}

export function AppointmentBlock({
  appointment,
  patientName,
  onClick,
}: AppointmentBlockProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(appointment) }}
      className="w-full text-left mb-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 overflow-hidden"
      aria-label={`${appointment.title} for ${patientName} at ${appointment.startTime}`}
    >
      <div className="flex">
        {/* Left accent bar — indicates status */}
        <div className={`w-1 flex-shrink-0 ${STATUS_ACCENT[appointment.status]}`} />

        {/* Content */}
        <div className="flex-1 min-w-0 px-2.5 py-2">
          <div className={`text-xs font-semibold text-gray-500 dark:text-gray-400 truncate ${STATUS_TEXT[appointment.status]}`}>
            {appointment.startTime}–{appointment.endTime}
          </div>
          <div className={`text-xs font-medium text-gray-900 dark:text-gray-100 truncate mt-0.5 ${STATUS_TEXT[appointment.status]}`}>
            {patientName}
          </div>
          <div className={`text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 ${STATUS_TEXT[appointment.status]}`}>
            {appointment.title}
          </div>
        </div>
      </div>
    </button>
  )
}
