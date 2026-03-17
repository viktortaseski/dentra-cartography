import { useEffect } from 'react'
import { useChartStore } from '@/store/chartStore'
import { PERMANENT_TEETH } from '@/lib/toothDefinitions'
import { ToothSVG } from './ToothSVG'
import { ConditionPicker } from './ConditionPicker'
import type { ToothChartEntry } from '@shared/types'

export interface DentalChartProps {
  patientId: number
}

// Standard dental chart display order (patient's right is viewer's left)
// Upper arch: patient's right → patient's left
const UPPER_ARCH_FDI = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
// Lower arch: patient's right → patient's left (mirrors upper for alignment)
const LOWER_ARCH_FDI = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

function getEntryForTooth(
  chartEntries: ToothChartEntry[],
  fdi: number
): ToothChartEntry | undefined {
  return chartEntries.find((e) => e.toothFdi === fdi)
}

function ArchRow({
  fdis,
  chartEntries,
  selectedToothFdi,
}: {
  fdis: number[]
  chartEntries: ToothChartEntry[]
  selectedToothFdi: number | null
}): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-1" role="row">
      {fdis.map((fdi, index) => {
        // Add a visual gap between quadrants (after index 7, i.e. between 11/21 and 48/31)
        const isMidGap = index === 7
        return (
          <div key={fdi} className={`flex items-center${isMidGap ? ' mr-4' : ''}`}>
            <ToothSVG
              fdi={fdi}
              chartEntry={getEntryForTooth(chartEntries, fdi)}
              isSelected={selectedToothFdi === fdi}
            />
          </div>
        )
      })}
    </div>
  )
}

function QuadrantLabels({ fdis }: { fdis: number[] }): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-1" aria-hidden="true">
      {fdis.map((fdi, index) => {
        const isMidGap = index === 7
        return (
          <div
            key={fdi}
            className={`w-[60px] text-center text-xs text-gray-400 font-mono${isMidGap ? ' mr-4' : ''}`}
          >
            {fdi}
          </div>
        )
      })}
    </div>
  )
}

// Validate that all FDI numbers used are actually in the tooth definitions list
const DEFINED_FDI_SET = new Set(PERMANENT_TEETH.map((t) => t.fdi))

function assertAllDefined(fdis: number[], archName: string): void {
  for (const fdi of fdis) {
    if (!DEFINED_FDI_SET.has(fdi)) {
      // Non-throwing assertion — log in development
      console.warn(`DentalChart: FDI ${fdi} in ${archName} arch is not in PERMANENT_TEETH`)
    }
  }
}

assertAllDefined(UPPER_ARCH_FDI, 'upper')
assertAllDefined(LOWER_ARCH_FDI, 'lower')

export function DentalChart({ patientId }: DentalChartProps): JSX.Element {
  const { chartEntries, isLoading, error, conditionPickerOpen, selectedToothFdi, loadChart } =
    useChartStore()

  useEffect(() => {
    void loadChart(patientId)
  }, [patientId, loadChart])

  return (
    <div className="flex flex-col items-center py-6 px-4 gap-4 select-none">
      {/* Error banner */}
      {error && (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 w-full max-w-2xl"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <p className="text-sm text-gray-500" aria-live="polite">
          Loading chart...
        </p>
      )}

      <div
        className={`flex flex-col gap-2 transition-opacity${isLoading ? ' opacity-40 pointer-events-none' : ''}`}
        aria-label="Dental chart"
        role="table"
      >
        {/* Upper arch label */}
        <div className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
          Upper
        </div>

        {/* Upper arch FDI numbers (above the teeth) */}
        <QuadrantLabels fdis={UPPER_ARCH_FDI} />

        {/* Upper arch teeth */}
        <ArchRow
          fdis={UPPER_ARCH_FDI}
          chartEntries={chartEntries}
          selectedToothFdi={selectedToothFdi}
        />

        {/* Midline separator */}
        <div className="my-3 border-t border-dashed border-gray-200 w-full" aria-hidden="true" />

        {/* Lower arch teeth */}
        <ArchRow
          fdis={LOWER_ARCH_FDI}
          chartEntries={chartEntries}
          selectedToothFdi={selectedToothFdi}
        />

        {/* Lower arch FDI numbers (below the teeth) */}
        <QuadrantLabels fdis={LOWER_ARCH_FDI} />

        {/* Lower arch label */}
        <div className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">
          Lower
        </div>
      </div>

      {/* Condition picker modal — rendered when a surface is selected */}
      {conditionPickerOpen && <ConditionPicker />}
    </div>
  )
}
