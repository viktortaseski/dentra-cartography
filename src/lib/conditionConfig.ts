import type { ToothCondition } from '@shared/types'

export interface ConditionConfig {
  label: string
  color: string       // Tailwind color class for UI elements
  svgFill: string     // Hex color for SVG surface rendering
  description: string
}

export const CONDITION_CONFIG: Record<ToothCondition, ConditionConfig> = {
  healthy: {
    label: 'Healthy',
    color: 'bg-gray-200',
    svgFill: '#e5e7eb',
    description: 'Tooth is healthy with no noted condition.',
  },
  caries: {
    label: 'Caries',
    color: 'bg-red-500',
    svgFill: '#ef4444',
    description: 'Active carious lesion (cavity) present on this surface.',
  },
  filling_amalgam: {
    label: 'Amalgam Filling',
    color: 'bg-gray-500',
    svgFill: '#6b7280',
    description: 'Existing amalgam (silver) restoration.',
  },
  filling_composite: {
    label: 'Composite Filling',
    color: 'bg-amber-500',
    svgFill: '#f59e0b',
    description: 'Existing tooth-colored composite resin restoration.',
  },
  crown: {
    label: 'Crown',
    color: 'bg-yellow-500',
    svgFill: '#eab308',
    description: 'Full-coverage crown present.',
  },
  extraction: {
    label: 'Extraction',
    color: 'bg-gray-900',
    svgFill: '#1f2937',
    description: 'Tooth has been extracted or is indicated for extraction.',
  },
  missing_congenital: {
    label: 'Missing (Congenital)',
    color: 'bg-gray-300',
    svgFill: '#d1d5db',
    description: 'Tooth is congenitally absent (never erupted).',
  },
  implant: {
    label: 'Implant',
    color: 'bg-blue-500',
    svgFill: '#3b82f6',
    description: 'Dental implant present at this site.',
  },
  root_canal: {
    label: 'Root Canal',
    color: 'bg-violet-500',
    svgFill: '#8b5cf6',
    description: 'Root canal treatment has been performed.',
  },
  bridge_pontic: {
    label: 'Bridge Pontic',
    color: 'bg-emerald-500',
    svgFill: '#10b981',
    description: 'Pontic (false tooth) component of a fixed bridge.',
  },
  fracture: {
    label: 'Fracture',
    color: 'bg-orange-500',
    svgFill: '#f97316',
    description: 'Tooth fracture noted.',
  },
  watch: {
    label: 'Watch',
    color: 'bg-cyan-500',
    svgFill: '#06b6d4',
    description: 'Area to monitor — early lesion or suspicious finding.',
  },
}
