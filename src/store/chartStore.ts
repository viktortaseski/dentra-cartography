import { create } from 'zustand'
import type {
  ToothChartEntry,
  ToothSurface,
  ToothCondition,
  SetToothConditionRequest,
} from '@shared/types'
import { getChartForPatient, setToothCondition, addTreatment } from '@/lib/ipc'
import { useTreatmentStore } from '@/store/treatmentStore'

interface ChartState {
  chartEntries: ToothChartEntry[]
  isLoading: boolean
  error: string | null
  selectedToothFdi: number | null
  selectedSurface: ToothSurface | null
  conditionPickerOpen: boolean
  /** The patientId whose chart is currently loaded */
  loadedPatientId: number | null
}

interface ChartActions {
  loadChart: (patientId: number) => Promise<void>
  setCondition: (req: SetToothConditionRequest) => Promise<void>
  openConditionPicker: (toothFdi: number, surface: ToothSurface) => void
  closeConditionPicker: () => void
  /** Returns the condition for a given tooth surface; falls back to 'healthy' */
  getCondition: (toothFdi: number, surface: ToothSurface) => ToothCondition
}

export type ChartStore = ChartState & ChartActions

export const useChartStore = create<ChartStore>((set, get) => ({
  // State
  chartEntries: [],
  isLoading: false,
  error: null,
  selectedToothFdi: null,
  selectedSurface: null,
  conditionPickerOpen: false,
  loadedPatientId: null,

  // Actions
  loadChart: async (patientId: number) => {
    set({ isLoading: true, error: null })
    try {
      const chartEntries = await getChartForPatient(patientId)
      set({ chartEntries, isLoading: false, loadedPatientId: patientId })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load chart',
      })
    }
  },

  setCondition: async (req: SetToothConditionRequest) => {
    set({ error: null })
    try {
      await setToothCondition(req)

      // Auto-create a treatment record for every condition change (append-only audit log)
      try {
        await addTreatment({
          patientId: req.patientId,
          toothFdi: req.toothFdi,
          surface: req.surface,
          conditionType: req.condition,
          status: 'completed',
          datePerformed: new Date().toISOString().split('T')[0],
          performedBy: null,
          notes: null,
        })
        // Refresh the treatment panel for the current patient
        void useTreatmentStore.getState().loadTreatmentsForPatient(req.patientId)
      } catch {
        // Treatment creation is best-effort — do not block or surface to the user
        // if the chart condition write itself succeeded
      }

      // Optimistically update the local store so the chart re-renders immediately
      set((state) => {
        const existingEntryIndex = state.chartEntries.findIndex(
          (e) => e.toothFdi === req.toothFdi
        )

        if (existingEntryIndex === -1) {
          // No entry yet for this tooth — create one
          const newEntry: ToothChartEntry = {
            toothFdi: req.toothFdi,
            surfaces: [{ surface: req.surface, condition: req.condition }],
          }
          return { chartEntries: [...state.chartEntries, newEntry] }
        }

        // Entry exists — update or add the surface record
        const updatedEntries = state.chartEntries.map((entry) => {
          if (entry.toothFdi !== req.toothFdi) return entry

          const surfaceExists = entry.surfaces.some((s) => s.surface === req.surface)
          const updatedSurfaces = surfaceExists
            ? entry.surfaces.map((s) =>
                s.surface === req.surface ? { surface: req.surface, condition: req.condition } : s
              )
            : [...entry.surfaces, { surface: req.surface, condition: req.condition }]

          return { ...entry, surfaces: updatedSurfaces }
        })

        return { chartEntries: updatedEntries }
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to set condition',
      })
    }
  },

  openConditionPicker: (toothFdi: number, surface: ToothSurface) => {
    set({ selectedToothFdi: toothFdi, selectedSurface: surface, conditionPickerOpen: true })
  },

  closeConditionPicker: () => {
    set({ conditionPickerOpen: false, selectedToothFdi: null, selectedSurface: null })
  },

  getCondition: (toothFdi: number, surface: ToothSurface): ToothCondition => {
    const entry = get().chartEntries.find((e) => e.toothFdi === toothFdi)
    if (!entry) return 'healthy'
    const surfaceRecord = entry.surfaces.find((s) => s.surface === surface)
    return surfaceRecord?.condition ?? 'healthy'
  },
}))
