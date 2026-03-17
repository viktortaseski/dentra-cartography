import { useState, type ChangeEvent } from 'react'
import type { Patient } from '@shared/types'
import { PatientCard } from '@/components/patients/PatientCard'
import { useTranslation } from '@/lib/i18n'

interface SidebarProps {
  patients: Patient[]
  selectedPatientId: number | null
  isLoading: boolean
  onSelectPatient: (id: number) => void
  onNewPatient: () => void
  onOpenSettings: () => void
  onOpenCalendar: () => void
}

export function Sidebar({
  patients,
  selectedPatientId,
  isLoading,
  onSelectPatient,
  onNewPatient,
  onOpenSettings,
  onOpenCalendar,
}: SidebarProps): JSX.Element {
  const t = useTranslation()
  const [query, setQuery] = useState('')

  function handleQueryChange(e: ChangeEvent<HTMLInputElement>): void {
    setQuery(e.target.value)
  }

  const filtered = query.trim()
    ? patients.filter((p) =>
        p.fullName.toLowerCase().includes(query.trim().toLowerCase())
      )
    : patients

  return (
    <aside
      className="flex flex-col w-[280px] min-w-[280px] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      aria-label="Patient list"
    >
      {/* Sidebar header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Patients</h1>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3a6 6 0 100 12A6 6 0 009 3zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder={t.searchPatients}
            className="w-full pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label={t.searchPatients}
          />
        </div>
      </div>

      {/* Scrollable patient list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" role="list">
        {isLoading ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">{t.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
            {query.trim() ? 'No patients match your search.' : t.noPatients}
          </p>
        ) : (
          filtered.map((patient) => (
            <div key={patient.id} role="listitem">
              <PatientCard
                patient={patient}
                isSelected={patient.id === selectedPatientId}
                onSelect={onSelectPatient}
              />
            </div>
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
        {/* New patient button */}
        <button
          type="button"
          onClick={onNewPatient}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Create new patient"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          {t.newPatient}
        </button>

        {/* Calendar link */}
        <button
          type="button"
          onClick={onOpenCalendar}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open calendar"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          {t.calendar}
        </button>

        {/* Settings link */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open settings"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          {t.settings}
        </button>
      </div>
    </aside>
  )
}
