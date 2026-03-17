import type { Patient } from '@shared/types'
import { useChartStore } from '@/store/chartStore'
import { useTreatmentStore } from '@/store/treatmentStore'
import { ReportButton } from '@/components/reports/ReportButton'

interface TopBarProps {
  patient: Patient | null
  /** Title to display when a named view (e.g. "Settings", "Calendar") is active */
  viewTitle?: string
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

export function TopBar({ patient, viewTitle }: TopBarProps): JSX.Element {
  const chartEntries = useChartStore((s) => s.chartEntries)
  const treatments = useTreatmentStore((s) => s.treatments)
  const isMac = navigator.userAgent.includes('Mac')

  return (
    <header
      className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: app name / breadcrumb — extra left padding on macOS to clear traffic lights */}
      <div
        className={['flex items-center gap-3 min-w-0', isMac ? 'pl-20' : ''].join(' ').trim()}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="text-sm font-semibold text-blue-700 tracking-tight select-none">
          Dental Cartography
        </span>
        {viewTitle && (
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
            <span className="text-sm font-semibold text-gray-900">{viewTitle}</span>
          </>
        )}
        {!viewTitle && patient && (
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

      {/* Right: PDF export (only when a patient is active and no alternate view) */}
      {patient && !viewTitle && (
        <div
          className="flex items-center gap-2 flex-shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <ReportButton
            patient={patient}
            chartEntries={chartEntries}
            treatments={treatments}
          />
        </div>
      )}
    </header>
  )
}
