import { create } from 'zustand'
import type { Treatment, AddTreatmentRequest } from '@shared/types'
import { listTreatmentsForPatient, listTreatmentsForTooth, addTreatment } from '@/lib/ipc'

interface TreatmentState {
  treatments: Treatment[]
  isLoading: boolean
  error: string | null
}

interface TreatmentActions {
  loadTreatmentsForPatient: (patientId: number) => Promise<void>
  loadTreatmentsForTooth: (patientId: number, toothFdi: number) => Promise<void>
  addTreatment: (data: AddTreatmentRequest) => Promise<void>
  clearTreatments: () => void
}

export type TreatmentStore = TreatmentState & TreatmentActions

export const useTreatmentStore = create<TreatmentStore>((set) => ({
  // State
  treatments: [],
  isLoading: false,
  error: null,

  // Actions
  loadTreatmentsForPatient: async (patientId: number) => {
    set({ isLoading: true, error: null })
    try {
      const treatments = await listTreatmentsForPatient(patientId)
      set({ treatments, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load treatments',
      })
    }
  },

  loadTreatmentsForTooth: async (patientId: number, toothFdi: number) => {
    set({ isLoading: true, error: null })
    try {
      const treatments = await listTreatmentsForTooth(patientId, toothFdi)
      set({ treatments, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load treatments for tooth',
      })
    }
  },

  addTreatment: async (data: AddTreatmentRequest) => {
    set({ error: null })
    try {
      const newTreatment = await addTreatment(data)
      set((state) => ({
        treatments: [newTreatment, ...state.treatments],
      }))
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add treatment',
      })
    }
  },

  clearTreatments: () => {
    set({ treatments: [], error: null })
  },
}))
