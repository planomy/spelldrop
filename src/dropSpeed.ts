import type { DropSpeed } from './types'

export const DROP_SPEED_OPTIONS: { id: DropSpeed; label: string; emoji: string }[] = [
  { id: 'chill', label: 'Chill', emoji: '🍃' },
  { id: 'normal', label: 'Normal', emoji: '⚡' },
  { id: 'fast', label: 'Fast', emoji: '🔥' },
  { id: 'turbo', label: 'Turbo', emoji: '🚀' },
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
