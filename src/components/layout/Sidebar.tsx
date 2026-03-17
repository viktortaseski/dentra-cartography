import { useState, type ChangeEvent } from 'react'
import type { Patient } from '@shared/types'
import { PatientCard } from '@/components/patients/PatientCard'

interface SidebarProps {
  patients: Patient[]
  selectedPatientId: number | null
  isLoading: boolean
  onSelectPatient: (id: number) => void
  onNewPatient: () => void
}

export function Sidebar({
  patients,
  selectedPatientId,
  isLoading,
  onSelectPatient,
  onNewPatient,
}: SidebarProps): JSX.Element {
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
      className="flex flex-col w-[280px] min-w-[280px] h-full bg-white border-r border-gray-200"
      aria-label="Patient list"
    >
      {/* Sidebar header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h1 className="text-sm font-semibold text-gray-900 mb-3">Patients</h1>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
            placeholder="Search patients…"
            className="w-full pl-8 pr-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search patients"
          />
        </div>
      </div>

      {/* Scrollable patient list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" role="list">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center mt-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-8">
            {query.trim() ? 'No patients match your search.' : 'No patients yet.'}
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

      {/* New patient button */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onNewPatient}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Create new patient"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          New Patient
        </button>
      </div>
    </aside>
  )
}
