import type { Patient } from '@shared/types'

interface PatientCardProps {
  patient: Patient
  isSelected: boolean
  onSelect: (id: number) => void
}

function formatDob(dateOfBirth: string): string {
  // dateOfBirth is YYYY-MM-DD; display as MMM D, YYYY
  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PatientCard({ patient, isSelected, onSelect }: PatientCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(patient.id)}
      className={[
        'w-full text-left px-4 py-3 rounded-lg transition-colors duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
          : 'bg-white dark:bg-gray-800 border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600',
      ].join(' ')}
      aria-selected={isSelected}
      aria-label={`Select patient ${patient.fullName}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>
            {patient.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            DOB: {formatDob(patient.dateOfBirth)}
          </p>
        </div>
        {patient.medicalAlerts && (
          <span
            className="flex-shrink-0 inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded"
            title={patient.medicalAlerts}
            aria-label="Medical alerts present"
          >
            Alert
          </span>
        )}
      </div>
    </button>
  )
}
