import { useEffect, useRef, useState } from 'react'
import { useChartStore } from '@/store/chartStore'
import { PERMANENT_TEETH } from '@/lib/toothDefinitions'
import { ToothSVG } from './ToothSVG'
import { ConditionPicker } from './ConditionPicker'
import { useTranslation } from '@/lib/i18n'
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
            className={`w-[90px] text-center text-xs text-gray-400 dark:text-gray-500 font-mono${isMidGap ? ' mr-4' : ''}`}
          >
            {fdi}
          </div>
        )
      })}
    </div>
  )
}

// Half-width of one arch (8 teeth × 90px + 7 inter-tooth gaps × 4px)
const ARCH_HALF_WIDTH = 8 * 90 + 7 * 4 // 748px

function QuadrantRow({ leftLabel, rightLabel }: { leftLabel: string; rightLabel: string }): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-1" aria-hidden="true">
      <div style={{ width: ARCH_HALF_WIDTH }} className="flex justify-start pl-1">
        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {leftLabel}
        </span>
      </div>
      {/* mid gap spacer — matches mr-4 on index 7 tooth wrapper */}
      <div className="w-4 mr-4" />
      <div style={{ width: ARCH_HALF_WIDTH }} className="flex justify-end pr-1">
        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {rightLabel}
        </span>
      </div>
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

const ZOOM_BUTTON_CLASS =
  'w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-bold flex items-center justify-center'

export function DentalChart({ patientId }: DentalChartProps): JSX.Element {
  const t = useTranslation()
  const { chartEntries, isLoading, error, conditionPickerOpen, selectedToothFdi, loadChart } =
    useChartStore()

  // Zoom / pan state
  const DEFAULT_SCALE = 0.75
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [cursor, setCursor] = useState<'grab' | 'grabbing'>('grab')
  const isPanning = useRef(false)
  const panStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  function computeCenteredOffset(s: number): { x: number; y: number } {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return { x: 0, y: 0 }
    return {
      x: (container.clientWidth - content.scrollWidth * s) / 2,
      y: (container.clientHeight - content.scrollHeight * s) / 2,
    }
  }

  useEffect(() => {
    void loadChart(patientId)
  }, [patientId, loadChart])

  // Center chart at default scale after first render
  useEffect(() => {
    setOffset(computeCenteredOffset(DEFAULT_SCALE))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Non-passive wheel listener for zoom-to-cursor
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent): void => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      setScale((prev) => {
        const newScale = Math.max(0.3, Math.min(4, prev * factor))
        setOffset((prevOffset) => ({
          x: cx - (cx - prevOffset.x) * (newScale / prev),
          y: cy - (cy - prevOffset.y) * (newScale / prev),
        }))
        return newScale
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, []) // empty deps — uses setState functional form to avoid stale closures

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
    setCursor('grabbing')
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>): void {
    if (!isPanning.current) return
    setOffset({
      x: panStart.current.ox + (e.clientX - panStart.current.mx),
      y: panStart.current.oy + (e.clientY - panStart.current.my),
    })
  }

  function handleMouseUp(): void {
    isPanning.current = false
    setCursor('grab')
  }

  function handleMouseLeave(): void {
    isPanning.current = false
    setCursor('grab')
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-gray-50 dark:bg-gray-900"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Zoomable / pannable content */}
      <div
        ref={contentRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          cursor,
        }}
      >
        <div className="flex flex-col items-center py-8 px-6 gap-4">
          {/* Error banner */}
          {error && (
            <p
              className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 w-full max-w-2xl"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              {t.loadingChart}
            </p>
          )}

          <div
            className={`flex flex-col gap-2 transition-opacity${isLoading ? ' opacity-40 pointer-events-none' : ''}`}
            aria-label="Dental chart"
            role="table"
          >
            {/* Upper arch label */}
            <div className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              {t.upper}
            </div>

            {/* Patient orientation row */}
            <div
              className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 gap-2 mb-1"
              aria-hidden="true"
            >
              <span>&#8592; Patient&#39;s Right</span>
              <span className="mx-4 text-gray-300 dark:text-gray-600">|</span>
              <span>Patient&#39;s Left &#8594;</span>
            </div>

            {/* Upper quadrant labels (Q1 left / Q2 right) */}
            <QuadrantRow leftLabel="Q1" rightLabel="Q2" />

            {/* Arch rows wrapped in a relative container for the vertical midline */}
            <div className="relative inline-flex flex-col gap-2">
              {/* Vertical midline — runs full height, centered between the two halves */}
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px pointer-events-none
                  [background-image:repeating-linear-gradient(to_bottom,#d1d5db_0px,#d1d5db_6px,transparent_6px,transparent_10px)]
                  dark:[background-image:repeating-linear-gradient(to_bottom,#374151_0px,#374151_6px,transparent_6px,transparent_10px)]"
                aria-hidden="true"
              />

              {/* Upper arch FDI numbers (above the teeth) */}
              <QuadrantLabels fdis={UPPER_ARCH_FDI} />

              {/* Upper arch teeth */}
              <ArchRow
                fdis={UPPER_ARCH_FDI}
                chartEntries={chartEntries}
                selectedToothFdi={selectedToothFdi}
              />

              {/* Horizontal midline separator */}
              <div className="my-3 border-t border-dashed border-gray-200 dark:border-gray-700 w-full" aria-hidden="true" />

              {/* Lower quadrant labels (Q4 left / Q3 right) */}
              <QuadrantRow leftLabel="Q4" rightLabel="Q3" />

              {/* Lower arch teeth */}
              <ArchRow
                fdis={LOWER_ARCH_FDI}
                chartEntries={chartEntries}
                selectedToothFdi={selectedToothFdi}
              />

              {/* Lower arch FDI numbers (below the teeth) */}
              <QuadrantLabels fdis={LOWER_ARCH_FDI} />
            </div>

            {/* Lower arch label */}
            <div className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
              {t.lower}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls overlay — outside transform div, not scaled */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <button
          className={ZOOM_BUTTON_CLASS}
          onClick={() => setScale((s) => Math.min(4, s * 1.2))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className={ZOOM_BUTTON_CLASS}
          onClick={() => { setScale(DEFAULT_SCALE); setOffset(computeCenteredOffset(DEFAULT_SCALE)) }}
          aria-label="Reset zoom"
        >
          ⌂
        </button>
        <button
          className={ZOOM_BUTTON_CLASS}
          onClick={() => setScale((s) => Math.max(0.3, s * 0.8))}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Condition picker modal — outside transform div so it is not zoomed/offset */}
      {conditionPickerOpen && <ConditionPicker />}
    </div>
  )
}
