import type { ToothSurface } from '@shared/types'

export interface ToothDefinition {
  fdi: number
  name: string
  shortName: string
  quadrant: 1 | 2 | 3 | 4
  type: 'incisor' | 'canine' | 'premolar' | 'molar'
  surfaces: ToothSurface[]
}

// Surfaces by tooth type:
// Incisors and canines use incisal edge; premolars/molars use occlusal surface.
const ANTERIOR_SURFACES: ToothSurface[] = ['mesial', 'distal', 'buccal', 'lingual', 'incisal']
const POSTERIOR_SURFACES: ToothSurface[] = ['mesial', 'distal', 'buccal', 'lingual', 'occlusal']

// ── Permanent teeth — all 32 ─────────────────────────────────────────────────

export const PERMANENT_TEETH: ToothDefinition[] = [
  // ── Quadrant 1: Upper Right ───────────────────────────────────────────────
  { fdi: 11, name: 'Upper Right Central Incisor', shortName: 'UR1', quadrant: 1, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 12, name: 'Upper Right Lateral Incisor', shortName: 'UR2', quadrant: 1, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 13, name: 'Upper Right Canine',           shortName: 'UR3', quadrant: 1, type: 'canine',   surfaces: ANTERIOR_SURFACES },
  { fdi: 14, name: 'Upper Right First Premolar',   shortName: 'UR4', quadrant: 1, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 15, name: 'Upper Right Second Premolar',  shortName: 'UR5', quadrant: 1, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 16, name: 'Upper Right First Molar',      shortName: 'UR6', quadrant: 1, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 17, name: 'Upper Right Second Molar',     shortName: 'UR7', quadrant: 1, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 18, name: 'Upper Right Third Molar',      shortName: 'UR8', quadrant: 1, type: 'molar',    surfaces: POSTERIOR_SURFACES },

  // ── Quadrant 2: Upper Left ────────────────────────────────────────────────
  { fdi: 21, name: 'Upper Left Central Incisor',   shortName: 'UL1', quadrant: 2, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 22, name: 'Upper Left Lateral Incisor',   shortName: 'UL2', quadrant: 2, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 23, name: 'Upper Left Canine',             shortName: 'UL3', quadrant: 2, type: 'canine',   surfaces: ANTERIOR_SURFACES },
  { fdi: 24, name: 'Upper Left First Premolar',     shortName: 'UL4', quadrant: 2, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 25, name: 'Upper Left Second Premolar',    shortName: 'UL5', quadrant: 2, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 26, name: 'Upper Left First Molar',        shortName: 'UL6', quadrant: 2, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 27, name: 'Upper Left Second Molar',       shortName: 'UL7', quadrant: 2, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 28, name: 'Upper Left Third Molar',        shortName: 'UL8', quadrant: 2, type: 'molar',    surfaces: POSTERIOR_SURFACES },

  // ── Quadrant 3: Lower Left ────────────────────────────────────────────────
  { fdi: 31, name: 'Lower Left Central Incisor',   shortName: 'LL1', quadrant: 3, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 32, name: 'Lower Left Lateral Incisor',   shortName: 'LL2', quadrant: 3, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 33, name: 'Lower Left Canine',             shortName: 'LL3', quadrant: 3, type: 'canine',   surfaces: ANTERIOR_SURFACES },
  { fdi: 34, name: 'Lower Left First Premolar',     shortName: 'LL4', quadrant: 3, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 35, name: 'Lower Left Second Premolar',    shortName: 'LL5', quadrant: 3, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 36, name: 'Lower Left First Molar',        shortName: 'LL6', quadrant: 3, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 37, name: 'Lower Left Second Molar',       shortName: 'LL7', quadrant: 3, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 38, name: 'Lower Left Third Molar',        shortName: 'LL8', quadrant: 3, type: 'molar',    surfaces: POSTERIOR_SURFACES },

  // ── Quadrant 4: Lower Right ───────────────────────────────────────────────
  { fdi: 41, name: 'Lower Right Central Incisor',  shortName: 'LR1', quadrant: 4, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 42, name: 'Lower Right Lateral Incisor',  shortName: 'LR2', quadrant: 4, type: 'incisor',  surfaces: ANTERIOR_SURFACES },
  { fdi: 43, name: 'Lower Right Canine',            shortName: 'LR3', quadrant: 4, type: 'canine',   surfaces: ANTERIOR_SURFACES },
  { fdi: 44, name: 'Lower Right First Premolar',    shortName: 'LR4', quadrant: 4, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 45, name: 'Lower Right Second Premolar',   shortName: 'LR5', quadrant: 4, type: 'premolar', surfaces: POSTERIOR_SURFACES },
  { fdi: 46, name: 'Lower Right First Molar',       shortName: 'LR6', quadrant: 4, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 47, name: 'Lower Right Second Molar',      shortName: 'LR7', quadrant: 4, type: 'molar',    surfaces: POSTERIOR_SURFACES },
  { fdi: 48, name: 'Lower Right Third Molar',       shortName: 'LR8', quadrant: 4, type: 'molar',    surfaces: POSTERIOR_SURFACES },
]

// Index by FDI for O(1) lookups
const PERMANENT_TEETH_BY_FDI: ReadonlyMap<number, ToothDefinition> = new Map(
  PERMANENT_TEETH.map((t) => [t.fdi, t])
)

export function getToothDefinition(fdi: number): ToothDefinition | undefined {
  return PERMANENT_TEETH_BY_FDI.get(fdi)
}
