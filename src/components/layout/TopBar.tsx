import type { Patient } from '@shared/types'

interface TopBarProps {
  patient: Patient | null
  onEditPatient: () => void
  onArchivePatient: () => void
}

function formatDob(dateOfBirth: string): string {
  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TopBar({ patient, onEditPatient, onArchivePatient }: TopBarProps): JSX.Element {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Left: app name / breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-semibold text-blue-700 tracking-tight select-none">
          Dental Cartography
        </span>
        {patient && (
          <>
            <svg
              className="w-4 h-4 text-gray-300 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {patient.fullName}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                DOB: {formatDob(patient.dateOfBirth)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: actions */}
      {patient && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onEditPatient}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Edit patient ${patient.fullName}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={onArchivePatient}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={`Archive patient ${patient.fullName}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path
                fillRule="evenodd"
                d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Archive
          </button>
        </div>
      )}
    </header>
  )
}
