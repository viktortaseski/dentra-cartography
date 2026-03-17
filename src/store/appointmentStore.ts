import { create } from 'zustand'
import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '@shared/types'
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '@/lib/ipc'

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

interface AppointmentState {
  appointments: Appointment[]
  isLoading: boolean
  error: string | null
  selectedDate: string // YYYY-MM-DD
}

interface AppointmentActions {
  loadAppointments: (date?: string) => Promise<void>
  createAppointment: (data: CreateAppointmentRequest) => Promise<void>
  updateAppointment: (id: number, data: UpdateAppointmentRequest) => Promise<void>
  deleteAppointment: (id: number) => Promise<void>
  setSelectedDate: (date: string) => void
}

export type AppointmentStore = AppointmentState & AppointmentActions

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  // State
  appointments: [],
  isLoading: false,
  error: null,
  selectedDate: todayIso(),

  // Actions
  loadAppointments: async (date?: string) => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await listAppointments(date)
      set({ appointments, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load appointments',
      })
    }
  },

  createAppointment: async (data: CreateAppointmentRequest) => {
    set({ error: null })
    try {
      await createAppointment(data)
      // Reload all appointments so the full week stays fresh
      await get().loadAppointments()
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create appointment',
      })
    }
  },

  updateAppointment: async (id: number, data: UpdateAppointmentRequest) => {
    set({ error: null })
    try {
      await updateAppointment(id, data)
      // Reload all appointments so the full week stays fresh
      await get().loadAppointments()
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update appointment',
      })
    }
  },

  deleteAppointment: async (id: number) => {
    set({ error: null })
    try {
      await deleteAppointment(id)
      // Reload all appointments so the full week stays fresh
      await get().loadAppointments()
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete appointment',
      })
    }
  },

  setSelectedDate: (date: string) => {
    // Only update the selected date — week view filters client-side from the full appointments list
    set({ selectedDate: date })
  },
}))
