import type { Appointment, AppointmentStatus } from '@shared/types'

interface AppointmentBlockProps {
  appointment: Appointment
  patientName: string
  onClick: (appointment: Appointment) => void
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-900',
  completed: 'bg-green-100 border-green-300 text-green-900',
  cancelled: 'bg-gray-100 border-gray-300 text-gray-500 line-through',
  no_show: 'bg-red-100 border-red-300 text-red-900',
}

export function AppointmentBlock({
  appointment,
  patientName,
  onClick,
}: AppointmentBlockProps): JSX.Element {
  const colorClass = STATUS_COLORS[appointment.status]

  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      className={[
        'w-full text-left px-2 py-1.5 rounded border text-xs mb-1 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        colorClass,
      ].join(' ')}
      aria-label={`${appointment.title} for ${patientName} at ${appointment.startTime}`}
    >
      <div className="font-medium truncate">
        {appointment.startTime}–{appointment.endTime}
      </div>
      <div className="truncate">{patientName}</div>
      <div className="truncate text-[11px] opacity-75">{appointment.title}</div>
    </button>
  )
}
