import { useState } from 'react'
import type { ToothChartEntry, ToothSurface } from '@shared/types'
import { CONDITION_CONFIG } from '@/lib/conditionConfig'
import { getToothDefinition } from '@/lib/toothDefinitions'
import type { ToothDefinition } from '@/lib/toothDefinitions'
import { getToothImageSrc } from '@/lib/toothImages'
import { useChartStore } from '@/store/chartStore'
import { useUIStore } from '@/store/uiStore'

// ── SVG coordinate constants (viewBox 0 0 60 68) ────────────────────────────
//
// Tooth outline background (decorative, not clickable):
//   rect x=4, y=2, w=52, h=48, rx=6
//
// Center square (occlusal / incisal): x=18, y=14, w=24, h=24, rx=3
// Buccal triangle:  top edge of center rect, apex at y=4  → "18,14 42,14 30,4"
// Lingual triangle: bottom edge of center rect, apex at y=48 → "18,38 42,38 30,48"
// Mesial triangle:  left edge of center rect, apex at x=6  → "18,14 18,38 6,26"
// Distal triangle:  right edge of center rect, apex at x=54 → "42,14 42,38 54,26"
//
// FDI label: text at x=30, y=62
//
// Orientation note: buccal is towards the cheek.  In a standard dental chart
// viewed from the front, buccal is rendered at the top of the tooth diagram
// for both upper and lower arches.

const STROKE_NORMAL = '#9ca3af'    // gray-400
const STROKE_SELECTED = '#2563eb'  // blue-600
const STROKE_WIDTH = 1
const HEALTHY_FILL = '#e5e7eb'     // gray-200 — matches CONDITION_CONFIG healthy.svgFill

const HOVER_FILTER = 'brightness(0.88)'

// Center rect geometry
const CENTER_RECT = { x: 18, y: 14, width: 24, height: 24, rx: 3 }

// Surface polygon point strings within the 60×68 viewBox
const SURFACE_POLYGONS: Record<Exclude<ToothSurface, 'occlusal' | 'incisal'>, string> = {
  buccal:  '18,14 42,14 30,4',
  lingual: '18,38 42,38 30,48',
  mesial:  '18,14 18,38 6,26',
  distal:  '42,14 42,38 54,26',
}

function getSurfaceFill(
  surface: ToothSurface,
  chartEntry: ToothChartEntry | undefined
): string {
  if (!chartEntry) return HEALTHY_FILL
  const record = chartEntry.surfaces.find((s) => s.surface === surface)
  if (!record) return HEALTHY_FILL
  return CONDITION_CONFIG[record.condition].svgFill
}

function getSurfaceLabel(
  surface: ToothSurface,
  chartEntry: ToothChartEntry | undefined
): string {
  if (!chartEntry) return 'Healthy'
  const record = chartEntry.surfaces.find((s) => s.surface === surface)
  if (!record) return 'Healthy'
  return CONDITION_CONFIG[record.condition].label
}


function surfaceFillOpacity(fill: string): number {
  return fill === HEALTHY_FILL ? 0.0 : 0.65
}

export interface ToothSVGProps {
  fdi: number
  chartEntry: ToothChartEntry | undefined
  isSelected: boolean
}

export function ToothSVG({ fdi, chartEntry, isSelected }: ToothSVGProps): JSX.Element {
  const { openConditionPicker } = useChartStore()
  const theme = useUIStore((s) => s.theme)
  const definition = getToothDefinition(fdi)

  const [hoveredSurface, setHoveredSurface] = useState<ToothSurface | null>(null)

  // Determine which center surface applies based on tooth type
  const centerSurface: ToothSurface =
    definition?.type === 'incisor' || definition?.type === 'canine' ? 'incisal' : 'occlusal'

  const stroke = isSelected ? STROKE_SELECTED : STROKE_NORMAL

  function handleSurfaceClick(surface: ToothSurface): void {
    openConditionPicker(fdi, surface)
  }

  function surfaceFilter(surface: ToothSurface): string | undefined {
    return hoveredSurface === surface ? HOVER_FILTER : undefined
  }

  const centerFill = getSurfaceFill(centerSurface, chartEntry)
  const centerLabel = getSurfaceLabel(centerSurface, chartEntry)

  const imageSrc = getToothImageSrc(definition)
  // Quadrant 2 (upper left) and quadrant 3 (lower left) are mirrored horizontally
  const shouldMirror = definition !== undefined && (definition.quadrant === 2 || definition.quadrant === 3)
  const imageTransform = shouldMirror ? 'scale(-1,1) translate(-60,0)' : undefined

  return (
    <svg
      viewBox="0 0 60 68"
      width="90"
      height="100"
      aria-label={`Tooth ${fdi}${definition ? ` — ${definition.name}` : ''}`}
      role="group"
      overflow="visible"
    >
      <title>{definition ? definition.name : `Tooth ${fdi}`}</title>

      {/* Tooth background image — rendered when image is available, transparent background */}
      {theme === 'dark' && imageSrc !== null && (
        <rect x={-2} y={-2} width={64} height={58} rx={5} fill="white" opacity={0.92} aria-hidden="true" />
      )}
      {imageSrc !== null ? (
        <image
          href={imageSrc}
          x={-2}
          y={-2}
          width={64}
          height={58}
          opacity={0.9}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          transform={imageTransform}
        />
      ) : null}

      {/* Center surface: occlusal or incisal */}
      <rect
        x={CENTER_RECT.x}
        y={CENTER_RECT.y}
        width={CENTER_RECT.width}
        height={CENTER_RECT.height}
        rx={CENTER_RECT.rx}
        fill={centerFill}
        fillOpacity={surfaceFillOpacity(centerFill)}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        cursor="pointer"
        role="button"
        aria-label={`Tooth ${fdi} ${centerSurface} surface — ${centerLabel}`}
        filter={surfaceFilter(centerSurface)}
        onClick={() => handleSurfaceClick(centerSurface)}
        onMouseEnter={() => setHoveredSurface(centerSurface)}
        onMouseLeave={() => setHoveredSurface(null)}
      />

      {/* Buccal triangle */}
      <polygon
        points={SURFACE_POLYGONS.buccal}
        fill={getSurfaceFill('buccal', chartEntry)}
        fillOpacity={surfaceFillOpacity(getSurfaceFill('buccal', chartEntry))}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        cursor="pointer"
        role="button"
        aria-label={`Tooth ${fdi} buccal surface — ${getSurfaceLabel('buccal', chartEntry)}`}
        filter={surfaceFilter('buccal')}
        onClick={() => handleSurfaceClick('buccal')}
        onMouseEnter={() => setHoveredSurface('buccal')}
        onMouseLeave={() => setHoveredSurface(null)}
      />

      {/* Lingual triangle */}
      <polygon
        points={SURFACE_POLYGONS.lingual}
        fill={getSurfaceFill('lingual', chartEntry)}
        fillOpacity={surfaceFillOpacity(getSurfaceFill('lingual', chartEntry))}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        cursor="pointer"
        role="button"
        aria-label={`Tooth ${fdi} lingual surface — ${getSurfaceLabel('lingual', chartEntry)}`}
        filter={surfaceFilter('lingual')}
        onClick={() => handleSurfaceClick('lingual')}
        onMouseEnter={() => setHoveredSurface('lingual')}
        onMouseLeave={() => setHoveredSurface(null)}
      />

      {/* Mesial triangle */}
      <polygon
        points={SURFACE_POLYGONS.mesial}
        fill={getSurfaceFill('mesial', chartEntry)}
        fillOpacity={surfaceFillOpacity(getSurfaceFill('mesial', chartEntry))}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        cursor="pointer"
        role="button"
        aria-label={`Tooth ${fdi} mesial surface — ${getSurfaceLabel('mesial', chartEntry)}`}
        filter={surfaceFilter('mesial')}
        onClick={() => handleSurfaceClick('mesial')}
        onMouseEnter={() => setHoveredSurface('mesial')}
        onMouseLeave={() => setHoveredSurface(null)}
      />

      {/* Distal triangle */}
      <polygon
        points={SURFACE_POLYGONS.distal}
        fill={getSurfaceFill('distal', chartEntry)}
        fillOpacity={surfaceFillOpacity(getSurfaceFill('distal', chartEntry))}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        cursor="pointer"
        role="button"
        aria-label={`Tooth ${fdi} distal surface — ${getSurfaceLabel('distal', chartEntry)}`}
        filter={surfaceFilter('distal')}
        onClick={() => handleSurfaceClick('distal')}
        onMouseEnter={() => setHoveredSurface('distal')}
        onMouseLeave={() => setHoveredSurface(null)}
      />

      {/* FDI number label — sits in the lower portion of the 68px tall viewBox */}
      <text
        x="30"
        y="62"
        textAnchor="middle"
        fontSize="10"
        fill="#6b7280"
        aria-hidden="true"
      >
        {fdi}
      </text>
    </svg>
  )
}
