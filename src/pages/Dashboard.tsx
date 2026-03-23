import { useEffect, useState } from 'react'
import { usePatientStore, selectSelectedPatient } from '@/store/patientStore'
import { useChartStore } from '@/store/chartStore'
import { useTreatmentStore } from '@/store/treatmentStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { PatientForm } from '@/components/patients/PatientForm'
import { PatientDetailCard } from '@/components/patients/PatientDetailCard'
import { TreatmentPanel } from '@/components/treatments'
import { ChartView } from '@/pages/ChartView'
import { Settings } from '@/pages/Settings'
import { CalendarView } from '@/pages/CalendarView'
import { RevenueView } from '@/pages/RevenueView'
import { useTranslation } from '@/lib/i18n'
import { UpdateBanner } from '@/components/UpdateBanner'
import type { Patient } from '@/types'

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; patient: Patient }

type ActiveView = 'chart' | 'settings' | 'calendar' | 'revenue'

export function Dashboard(): JSX.Element {
  const t = useTranslation()
  const { patients, selectedPatientId, isLoading, loadPatients, selectPatient, archivePatient } =
    usePatientStore()
  const selectedPatient = usePatientStore(selectSelectedPatient)
  const selectedToothFdi = useChartStore((s) => s.selectedToothFdi)
  const chartEntries = useChartStore((s) => s.chartEntries)
  const treatments = useTreatmentStore((s) => s.treatments)
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })
  const [activeView, setActiveView] = useState<ActiveView>('chart')

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  function handleNewPatient(): void {
    setModal({ kind: 'create' })
  }

  function handleEditPatient(): void {
    if (selectedPatient) {
      setModal({ kind: 'edit', patient: selectedPatient })
    }
  }

  function handleCloseModal(): void {
    setModal({ kind: 'closed' })
  }

  async function handleArchivePatient(): Promise<void> {
    if (selectedPatient) {
      const confirmed = window.confirm(t.archiveConfirm(selectedPatient.fullName))
      if (confirmed) {
        await archivePatient(selectedPatient.id)
      }
    }
  }

  function handleOpenSettings(): void {
    setActiveView('settings')
  }

  function handleOpenCalendar(): void {
    setActiveView('calendar')
  }

  function handleOpenRevenue(): void {
    setActiveView('revenue')
  }

  function handleSelectPatient(id: number): void {
    selectPatient(id)
    setActiveView('chart')
  }

  const topBarViewTitle =
    activeView === 'settings'
      ? t.settingsTitle
      : activeView === 'calendar'
      ? t.calendar
      : activeView === 'revenue'
      ? 'Revenue'
      : undefined

  // Only show patient in TopBar when in chart view
  const topBarPatient = activeView === 'chart' ? selectedPatient : null

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <UpdateBanner />
      {/* Left sidebar */}
      <Sidebar
        patients={patients}
        selectedPatientId={selectedPatientId}
        isLoading={isLoading}
        onSelectPatient={handleSelectPatient}
        onNewPatient={handleNewPatient}
        onOpenSettings={handleOpenSettings}
        onOpenCalendar={handleOpenCalendar}
        onOpenRevenue={handleOpenRevenue}
        onRefresh={loadPatients}
      />

      {/* Right main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          patient={topBarPatient}
          viewTitle={topBarViewTitle}
        />

        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeView === 'settings' && <Settings />}

          {activeView === 'calendar' && <CalendarView />}

          {activeView === 'revenue' && <RevenueView />}

          {activeView === 'chart' && (
            <>
              {selectedPatient ? (
                <>
                  <PatientDetailCard
                    patient={selectedPatient}
                    chartEntries={chartEntries}
                    treatments={treatments}
                    onEdit={handleEditPatient}
                    onArchive={() => void handleArchivePatient()}
                  />
                  <div className="flex-1 min-h-0 overflow-auto">
                    <ChartView patientId={selectedPatient.id} />
                  </div>
                  <TreatmentPanel
                    patientId={selectedPatient.id}
                    selectedToothFdi={selectedToothFdi}
                  />
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-3"
                      viewBox="0 0 48 48"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="8"
                        y="8"
                        width="32"
                        height="32"
                        rx="6"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="24" cy="20" r="5" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M14 36c0-5.523 4.477-10 10-10s10 4.477 10 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                      {t.selectPatient}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {t.selectPatientSub}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {modal.kind === 'create' && <PatientForm onClose={handleCloseModal} />}
      {modal.kind === 'edit' && (
        <PatientForm patient={modal.patient} onClose={handleCloseModal} />
      )}
    </div>
  )
}
