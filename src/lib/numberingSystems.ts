// FDI is the canonical internal tooth numbering format.
// This module converts FDI numbers to Universal or Palmer at render time only.
// Never store or compare using converted numbers.

export type NumberingSystem = 'FDI' | 'Universal' | 'Palmer'

// ── FDI → Universal ──────────────────────────────────────────────────────────
// Permanent teeth only (FDI 11–18, 21–28, 31–38, 41–48)
// Upper right (Q1): 11–18 → Universal 8–1   (reversed: 11→8, 12→7, ..., 18→1)
// Upper left  (Q2): 21–28 → Universal 9–16  (ordered:  21→9, 22→10, ..., 28→16)
// Lower left  (Q3): 31–38 → Universal 17–24 (ordered:  31→17, 32→18, ..., 38→24) — reversed within quadrant
// Lower right (Q4): 41–48 → Universal 25–32 (ordered:  41→25 ... wait: reversed 41→32, 48→25)
//
// Standard Universal numbering layout (from patient's upper-right to lower-right, continuous arc):
//   Upper arch, right to left:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
//   FDI mapping (right→left):  18 17 16 15 14 13 12 11 21 22  23 24 25 26 27 28
//   Lower arch, left to right: 17 18 19 20 21 22 23 24 25 26  27 28 29 30 31 32
//   FDI mapping (left→right):  38 37 36 35 34 33 32 31 41 42  43 44 45 46 47 48

const FDI_TO_UNIVERSAL: ReadonlyMap<number, number> = new Map([
  // Upper right quadrant (Q1): FDI 11–18 → Universal 8–1
  [11, 8], [12, 7], [13, 6], [14, 5], [15, 4], [16, 3], [17, 2], [18, 1],
  // Upper left quadrant (Q2): FDI 21–28 → Universal 9–16
  [21, 9], [22, 10], [23, 11], [24, 12], [25, 13], [26, 14], [27, 15], [28, 16],
  // Lower left quadrant (Q3): FDI 31–38 → Universal 17–24 (31=most anterior on lower left)
  [31, 24], [32, 23], [33, 22], [34, 21], [35, 20], [36, 19], [37, 18], [38, 17],
  // Lower right quadrant (Q4): FDI 41–48 → Universal 25–32
  [41, 25], [42, 26], [43, 27], [44, 28], [45, 29], [46, 30], [47, 31], [48, 32],
])

export function fdiToUniversal(fdi: number): number | null {
  return FDI_TO_UNIVERSAL.get(fdi) ?? null
}

// ── FDI → Palmer ─────────────────────────────────────────────────────────────
// Palmer uses quadrant prefix + position within quadrant (1 = most anterior).
// Format used here: "UR1"–"UR8", "UL1"–"UL8", "LL1"–"LL8", "LR1"–"LR8"
// Position 1 is always the central incisor; position 8 is the third molar.

const PALMER_QUADRANT: ReadonlyMap<number, string> = new Map([
  [1, 'UR'],
  [2, 'UL'],
  [3, 'LL'],
  [4, 'LR'],
])

export function fdiToPalmer(fdi: number): string | null {
  if (fdi < 11 || fdi > 48) return null
  const quadrant = Math.floor(fdi / 10)
  const position = fdi % 10
  if (position < 1 || position > 8) return null
  const prefix = PALMER_QUADRANT.get(quadrant)
  if (prefix === undefined) return null
  return `${prefix}${position}`
}

// ── Display label ─────────────────────────────────────────────────────────────

export function toothLabel(fdi: number, system: NumberingSystem): string {
  switch (system) {
    case 'FDI':
      return String(fdi)
    case 'Universal': {
      const u = fdiToUniversal(fdi)
      return u !== null ? String(u) : String(fdi)
    }
    case 'Palmer': {
      const p = fdiToPalmer(fdi)
      return p !== null ? p : String(fdi)
    }
  }
}
