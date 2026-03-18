import type { Appointment } from '@shared/types'
import { usePatientStore } from '@/store/patientStore'
import { useTranslation } from '@/lib/i18n'
import { AppointmentBlock } from './AppointmentBlock'

interface WeekViewProps {
  /** ISO YYYY-MM-DD — any day within the week to display */
  selectedDate: string
  appointments: Appointment[]
  onSelectDate: (date: string) => void
  onAppointmentClick: (appointment: Appointment) => void
  onEmptyDayClick: (date: string) => void
}

function getWeekDates(iso: string): Date[] {
  const [year, month, day] = iso.split('-').map(Number)
  const anchor = new Date(year, month - 1, day)
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayIso(): string {
  return toIso(new Date())
}

export function WeekView({
  selectedDate,
  appointments,
  onSelectDate,
  onAppointmentClick,
  onEmptyDayClick,
}: WeekViewProps): JSX.Element {
  const t = useTranslation()
  const patients = usePatientStore((s) => s.patients)
  const patientMap = new Map(patients.map((p) => [p.id, p.fullName]))

  const weekDates = getWeekDates(selectedDate)
  const today = todayIso()

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden border-t border-gray-200 dark:border-gray-700">
      {weekDates.map((date) => {
        const iso = toIso(date)
        const isToday = iso === today
        const isSelected = iso === selectedDate
        const dayAppts = appointments
          .filter((a) => a.date === iso)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        return (
          <div
            key={iso}
            className="flex flex-col flex-1 border-r border-gray-100 dark:border-gray-700 last:border-r-0 min-w-0"
          >
            {/* Column header */}
            <button
              type="button"
              onClick={() => onSelectDate(iso)}
              className={[
                'flex flex-col items-center py-2 text-xs font-medium border-b border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isToday
                  ? 'bg-blue-600 text-white'
                  : isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
              aria-label={`Select ${iso}`}
              aria-pressed={isSelected}
            >
              <span>{t.days[date.getDay()]}</span>
              <span className={`text-base font-semibold ${isToday ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                {date.getDate()}
              </span>
            </button>

            {/* Appointment blocks + empty area click target */}
            <div
              onClick={() => onEmptyDayClick(iso)}
              className="flex-1 p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              role="button"
              aria-label={`Add appointment on ${iso}`}
              tabIndex={-1}
            >
              {dayAppts.map((appt) => (
                <AppointmentBlock
                  key={appt.id}
                  appointment={appt}
                  patientName={
  (appt.patientId != null ? patientMap.get(appt.patientId) : undefined)
  ?? (appt.patientName ? `[Online] ${appt.patientName}` : 'Unknown')
}
                  onClick={(a) => onAppointmentClick(a)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
