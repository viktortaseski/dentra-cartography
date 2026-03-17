import type { Patient } from '@shared/types'
import { useTranslation } from '@/lib/i18n'

interface PatientDetailCardProps {
  patient: Patient
  onEdit: () => void
  onArchive: () => void
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function calculateAge(dateOfBirth: string): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const today = new Date()
  const dob = new Date(year, month - 1, day)
  let age = today.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!hasHadBirthdayThisYear) {
    age -= 1
  }
  return age
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function PatientDetailCard({
  patient,
  onEdit,
  onArchive,
}: PatientDetailCardProps): JSX.Element {
  const t = useTranslation()
  const age = calculateAge(patient.dateOfBirth)
  const hasInsurance =
    patient.insuranceProvider !== null || patient.insurancePolicy !== null

  return (
    <div className="mx-6 mt-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm flex-shrink-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">
            {patient.fullName}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            DOB: {formatDate(patient.dateOfBirth)}
            <span className="mx-1.5 text-gray-300 dark:text-gray-600">&bull;</span>
            Sex: {capitalize(patient.sex)}
            <span className="mx-1.5 text-gray-300 dark:text-gray-600">&bull;</span>
            Age: {age}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Edit ${patient.fullName}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            {t.editPatient}
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={`Archive ${patient.fullName}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path
                fillRule="evenodd"
                d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {t.archivePatient}
          </button>
        </div>
      </div>

      {/* Contact row */}
      {(patient.phone || patient.email || patient.address) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
          {patient.phone && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 mr-1">{t.phone}:</span>
              {patient.phone}
            </span>
          )}
          {patient.email && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 mr-1">{t.email}:</span>
              {patient.email}
            </span>
          )}
          {patient.address && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 mr-1">{t.address}:</span>
              {patient.address}
            </span>
          )}
        </div>
      )}

      {/* Insurance row */}
      {hasInsurance && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
          {patient.insuranceProvider && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 mr-1">{t.insurance}:</span>
              {patient.insuranceProvider}
            </span>
          )}
          {patient.insurancePolicy && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 mr-1">{t.policy}:</span>
              {patient.insurancePolicy}
            </span>
          )}
        </div>
      )}

      {/* Medical alerts row */}
      {patient.medicalAlerts && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20">
          <svg
            className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
            {t.medicalAlerts}: {patient.medicalAlerts}
          </span>
        </div>
      )}
    </div>
  )
}
