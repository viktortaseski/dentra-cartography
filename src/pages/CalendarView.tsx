import { useEffect, useState } from 'react'
import type { Appointment } from '@shared/types'
import { useAppointmentStore } from '@/store/appointmentStore'
import { usePatientStore } from '@/store/patientStore'
import { syncExternalAppointments } from '@/lib/ipc'
import { useTranslation } from '@/lib/i18n'
import { MiniCalendar } from '@/components/appointments/MiniCalendar'
import { DaySidebar } from '@/components/appointments/DaySidebar'
import { WeekView } from '@/components/appointments/WeekView'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentDetailCard } from '@/components/appointments/AppointmentDetailCard'

type FormState =
  | { kind: 'closed' }
  | { kind: 'create'; initialDate: string }
  | { kind: 'edit'; appointment: Appointment }
  | { kind: 'detail'; appointment: Appointment }

type SyncStatus =
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | { kind: 'success'; count: number }
  | { kind: 'error'; message: string }

export function CalendarView(): JSX.Element {
  const t = useTranslation()
  const {
    appointments,
    isLoading,
    error,
    selectedDate,
    loadAppointments,
    setSelectedDate,
    deleteAppointment,
  } = useAppointmentStore()
  const patients = usePatientStore((s) => s.patients)

  const [formState, setFormState] = useState<FormState>({ kind: 'closed' })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: 'idle' })

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  function handleSelectDate(date: string): void {
    setSelectedDate(date)
  }

  function handleNewAppointment(): void {
    setFormState({ kind: 'create', initialDate: selectedDate })
  }

  function handleEmptyDayClick(date: string): void {
    setSelectedDate(date)
    setFormState({ kind: 'create', initialDate: date })
  }

  function handleAppointmentClick(appointment: Appointment): void {
    setFormState({ kind: 'detail', appointment })
  }

  function handleCloseForm(): void {
    setFormState({ kind: 'closed' })
  }

  function handleReschedule(appointment: Appointment): void {
    setFormState({ kind: 'edit', appointment })
  }

  function handleDelete(id: number): void {
    void deleteAppointment(id)
  }

  async function handleSync(): Promise<void> {
    setSyncStatus({ kind: 'syncing' })
    try {
      const result = await syncExternalAppointments()
      await loadAppointments()
      setSyncStatus({ kind: 'success', count: result.synced })
      setTimeout(() => setSyncStatus({ kind: 'idle' }), 3000)
    } catch (err) {
      setSyncStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Sync failed',
      })
      setTimeout(() => setSyncStatus({ kind: 'idle' }), 4000)
    }
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left panel */}
      <aside
        className="flex flex-col w-[240px] min-w-[240px] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"
        aria-label="Calendar sidebar"
      >
        <MiniCalendar
          selectedDate={selectedDate}
          appointments={appointments}
          onSelectDate={handleSelectDate}
        />
        <DaySidebar
          selectedDate={selectedDate}
          appointments={appointments}
          onNewAppointment={handleNewAppointment}
          onAppointmentClick={handleAppointmentClick}
        />
      </aside>

      {/* Main week view */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar with sync control */}
        <div className="flex items-center justify-end gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {syncStatus.kind === 'success' && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ {t.synced(syncStatus.count)}
            </span>
          )}
          {syncStatus.kind === 'error' && (
            <span className="text-xs text-red-600 dark:text-red-400">
              ✗ {syncStatus.message}
            </span>
          )}
          <button
            type="button"
            onClick={() => { void handleSync() }}
            disabled={syncStatus.kind === 'syncing'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={t.sync}
          >
            <svg
              className={`w-3.5 h-3.5 ${syncStatus.kind === 'syncing' ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {t.sync}
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading appointments…</p>
          </div>
        )}
        {error && (
          <div className="m-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          </div>
        )}
        {!isLoading && (
          <WeekView
            selectedDate={selectedDate}
            appointments={appointments}
            onSelectDate={handleSelectDate}
            onAppointmentClick={handleAppointmentClick}
            onEmptyDayClick={handleEmptyDayClick}
          />
        )}
      </div>

      {/* Modals */}
      {formState.kind === 'create' && (
        <AppointmentForm
          initialDate={formState.initialDate}
          onClose={handleCloseForm}
        />
      )}
      {formState.kind === 'edit' && (
        <AppointmentForm
          appointment={formState.appointment}
          onClose={handleCloseForm}
        />
      )}
      {formState.kind === 'detail' && (
        <AppointmentDetailCard
          appointment={formState.appointment}
          patient={patients.find((p) => p.id === formState.appointment.patientId)}
          onClose={handleCloseForm}
          onReschedule={handleReschedule}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
