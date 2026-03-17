import { useEffect, useState } from 'react'
import { usePatientStore, selectSelectedPatient } from '@/store/patientStore'
import { useChartStore } from '@/store/chartStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { PatientForm } from '@/components/patients/PatientForm'
import { TreatmentPanel } from '@/components/treatments'
import { ChartView } from '@/pages/ChartView'
import type { Patient } from '@/types'

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; patient: Patient }

export function Dashboard(): JSX.Element {
  const { patients, selectedPatientId, isLoading, loadPatients, selectPatient, archivePatient } =
    usePatientStore()
  const selectedPatient = usePatientStore(selectSelectedPatient)
  const selectedToothFdi = useChartStore((s) => s.selectedToothFdi)

  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })

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
      const confirmed = window.confirm(
        `Archive ${selectedPatient.fullName}? They will be removed from the patient list.`
      )
      if (confirmed) {
        await archivePatient(selectedPatient.id)
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Left sidebar */}
      <Sidebar
        patients={patients}
        selectedPatientId={selectedPatientId}
        isLoading={isLoading}
        onSelectPatient={selectPatient}
        onNewPatient={handleNewPatient}
      />

      {/* Right main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          patient={selectedPatient}
          onEditPatient={handleEditPatient}
          onArchivePatient={() => void handleArchivePatient()}
        />

        <main className="flex-1 overflow-y-auto flex flex-col">
          {selectedPatient ? (
            <>
              <ChartView patientId={selectedPatient.id} />
              <TreatmentPanel
                patientId={selectedPatient.id}
                selectedToothFdi={selectedToothFdi}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto w-12 h-12 text-gray-300 mb-3"
                  viewBox="0 0 48 48"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
                  <circle cx="24" cy="20" r="5" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M14 36c0-5.523 4.477-10 10-10s10 4.477 10 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-base font-medium text-gray-500">
                  Select a patient to view their chart
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Choose a patient from the sidebar or create a new one.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modal.kind === 'create' && (
        <PatientForm onClose={handleCloseModal} />
      )}
      {modal.kind === 'edit' && (
        <PatientForm patient={modal.patient} onClose={handleCloseModal} />
      )}
    </div>
  )
}
