import type { Appointment } from '@shared/types'
import { useTranslation } from '@/lib/i18n'

interface MiniCalendarProps {
  selectedDate: string // YYYY-MM-DD
  appointments: Appointment[]
  onSelectDate: (date: string) => void
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

function getDaysInMonth(year: number, month: number): Date[] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []

  // pad start with empty slots so grid aligns with day-of-week
  const startPad = firstDay.getDay() // 0=Sun
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -(startPad - 1 - i))
    days.push(d)
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // pad end to fill last row
  const endPad = 7 - (days.length % 7)
  if (endPad < 7) {
    for (let i = 1; i <= endPad; i++) {
      days.push(new Date(year, month + 1, i))
    }
  }
  return days
}

export function MiniCalendar({
  selectedDate,
  appointments,
  onSelectDate,
}: MiniCalendarProps): JSX.Element {
  const t = useTranslation()
  const [selYear, selMonth] = selectedDate.split('-').map(Number)
  const today = todayIso()

  // Build set of dates that have appointments for dot indicators
  const datesWithAppointments = new Set(appointments.map((a) => a.date))

  const days = getDaysInMonth(selYear, selMonth - 1)

  // Derive 2-letter day labels from t.days (use first 2 chars of each)
  const dayLabels = t.days.map((d) => d.slice(0, 2))

  function prevMonth(): void {
    const d = new Date(selYear, selMonth - 2, 1) // go back one month
    onSelectDate(toIso(d))
  }

  function nextMonth(): void {
    const d = new Date(selYear, selMonth, 1) // go forward one month
    onSelectDate(toIso(d))
  }

  return (
    <div className="px-3 py-3 select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t.months[selMonth - 1]} {selYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((label, idx) => (
          <div key={idx} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-0.5">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((date, idx) => {
          const iso = toIso(date)
          const isCurrentMonth = date.getMonth() === selMonth - 1
          const isSelected = iso === selectedDate
          const isToday = iso === today
          const hasDot = datesWithAppointments.has(iso) && isCurrentMonth

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={[
                'relative flex flex-col items-center justify-center w-full aspect-square rounded text-[11px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isToday
                  ? 'ring-1 ring-blue-400 text-blue-700 dark:text-blue-400 font-semibold'
                  : isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
              aria-label={iso}
              aria-pressed={isSelected}
            >
              {date.getDate()}
              {hasDot && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-blue-500'
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
