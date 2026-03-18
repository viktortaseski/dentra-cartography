import upperIncisor from '@/assets/teeth/upper-incisor.svg?url'
import upperCanine from '@/assets/teeth/upper-canine.svg?url'
import upperPremolar from '@/assets/teeth/upper-premolar.svg?url'
import upperMolar from '@/assets/teeth/upper-molar.svg?url'
import lowerIncisor from '@/assets/teeth/lower-incisor.svg?url'
import lowerCanine from '@/assets/teeth/lower-canine.svg?url'
import lowerPremolar from '@/assets/teeth/lower-premolar.svg?url'
import lowerMolar from '@/assets/teeth/lower-molar.svg?url'
import type { ToothDefinition } from '@/lib/toothDefinitions'

const TOOTH_IMAGE_MAP: Record<string, string> = {
  'upper-incisor':  upperIncisor,
  'upper-canine':   upperCanine,
  'upper-premolar': upperPremolar,
  'upper-molar':    upperMolar,
  'lower-incisor':  lowerIncisor,
  'lower-canine':   lowerCanine,
  'lower-premolar': lowerPremolar,
  'lower-molar':    lowerMolar,
}

export function getToothImageSrc(definition: ToothDefinition | undefined): string | null {
  if (!definition) return null
  const arch = definition.quadrant <= 2 ? 'upper' : 'lower'
  return TOOTH_IMAGE_MAP[`${arch}-${definition.type}`] ?? null
}
