import { SPEED_ICON_BY_ID } from './icons'
import type { DropSpeed } from './types'

export const DROP_SPEED_OPTIONS: { id: DropSpeed; label: string; icon: string }[] = [
  { id: 'chill', label: 'Chill', icon: SPEED_ICON_BY_ID.chill },
  { id: 'normal', label: 'Normal', icon: SPEED_ICON_BY_ID.normal },
  { id: 'fast', label: 'Fast', icon: SPEED_ICON_BY_ID.fast },
  { id: 'turbo', label: 'Turbo', icon: SPEED_ICON_BY_ID.turbo },
]

export function getFallSpeedMultiplier(speed: DropSpeed): number {
  switch (speed) {
    case 'chill':
      return 0.72
    case 'fast':
      return 1.35
    case 'turbo':
      return 1.75
    default:
      return 1
  }
}

export function getSpawnIntervalMs(speed: DropSpeed, base = 650): number {
  switch (speed) {
    case 'chill':
      return Math.round(base * 1.35)
    case 'fast':
      return Math.round(base * 0.78)
    case 'turbo':
      return Math.round(base * 0.58)
    default:
      return base
  }
}
