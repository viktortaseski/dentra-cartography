import { useEffect, useState } from 'react'
import type { Appointment } from '@shared/types'
import { useAppointmentStore } from '@/store/appointmentStore'
import { usePatientStore } from '@/store/patientStore'
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

export function CalendarView(): JSX.Element {
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
