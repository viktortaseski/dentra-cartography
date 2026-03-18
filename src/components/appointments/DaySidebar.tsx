import type { Appointment } from '@shared/types'
import { usePatientStore } from '@/store/patientStore'
import { useTranslation } from '@/lib/i18n'

interface DaySidebarProps {
  selectedDate: string // YYYY-MM-DD
  appointments: Appointment[]
  onNewAppointment: () => void
  onAppointmentClick: (appointment: Appointment) => void
}

function formatSelectedDate(iso: string, days: string[], months: string[]): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${days[date.getDay()]}, ${months[month - 1]} ${day}`
}

export function DaySidebar({
  selectedDate,
  appointments,
  onNewAppointment,
  onAppointmentClick,
}: DaySidebarProps): JSX.Element {
  const t = useTranslation()
  const patients = usePatientStore((s) => s.patients)
  const patientMap = new Map(patients.map((p) => [p.id, p.fullName]))

  const dayAppointments = appointments
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Use full day names by expanding the 3-char short forms
  const FULL_DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ]

  return (
    <div className="flex flex-col border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 flex-1 min-h-0">
      {/* Date heading */}
      <div className="px-3 mb-2">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {formatSelectedDate(selectedDate, FULL_DAY_NAMES, t.months)}
        </p>
      </div>

      {/* Appointment list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5">
        {dayAppointments.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">{t.noAppointmentsToday}</p>
        ) : (
          dayAppointments.map((appt) => (
            <button
              key={appt.id}
              type="button"
              onClick={() => onAppointmentClick(appt)}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {appt.startTime}–{appt.endTime}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{appt.title}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {
  (appt.patientId != null ? patientMap.get(appt.patientId) : undefined)
  ?? (appt.patientName ? `[Online] ${appt.patientName}` : 'Unknown patient')
}
              </p>
            </button>
          ))
        )}
      </div>

      {/* New appointment button */}
      <div className="px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={onNewAppointment}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Create new appointment"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          {t.newAppointment}
        </button>
      </div>
    </div>
  )
}
