import { create } from 'zustand'
import type { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types'
import {
  listPatients,
  createPatient,
  updatePatient,
  archivePatient,
} from '@/lib/ipc'

interface PatientState {
  patients: Patient[]
  selectedPatientId: number | null
  isLoading: boolean
  error: string | null
}

interface PatientActions {
  loadPatients: () => Promise<void>
  createPatient: (data: CreatePatientRequest) => Promise<void>
  updatePatient: (id: number, data: UpdatePatientRequest) => Promise<void>
  archivePatient: (id: number) => Promise<void>
  selectPatient: (id: number | null) => void
}

export type PatientStore = PatientState & PatientActions

export const usePatientStore = create<PatientStore>((set, get) => ({
  // State
  patients: [],
  selectedPatientId: null,
  isLoading: false,
  error: null,

  // Actions
  loadPatients: async () => {
    set({ isLoading: true, error: null })
    try {
      const patients = await listPatients()
      set({ patients, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load patients',
      })
    }
  },

  createPatient: async (data: CreatePatientRequest) => {
    set({ isLoading: true, error: null })
    try {
      const newPatient = await createPatient(data)
      set((state) => ({
        patients: [...state.patients, newPatient],
        selectedPatientId: newPatient.id,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create patient',
      })
    }
  },

  updatePatient: async (id: number, data: UpdatePatientRequest) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await updatePatient(id, data)
      set((state) => ({
        patients: state.patients.map((p) => (p.id === id ? updated : p)),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update patient',
      })
    }
  },

  archivePatient: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await archivePatient(id)
      set((state) => {
        const nextSelectedId =
          state.selectedPatientId === id ? null : state.selectedPatientId
        return {
          patients: state.patients.filter((p) => p.id !== id),
          selectedPatientId: nextSelectedId,
          isLoading: false,
        }
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to archive patient',
      })
    }
  },

  selectPatient: (id: number | null) => {
    set({ selectedPatientId: id })
  },
}))

// Selectors — derived data computed outside the store
export const selectSelectedPatient = (state: PatientStore): Patient | null => {
  if (state.selectedPatientId === null) return null
  return state.patients.find((p) => p.id === state.selectedPatientId) ?? null
}
