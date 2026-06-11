import goalComplete from './assets/icons/goal-complete.png'
import goalStreak from './assets/icons/goal-streak.png'
import goalNinja from './assets/icons/goal-ninja.png'
import goalSpeed from './assets/icons/goal-speed.png'
import goalScore from './assets/icons/goal-score.png'
import badgeStreak5 from './assets/icons/badge-streak-5.png'
import badgeStreak10 from './assets/icons/badge-streak-10.png'
import badgeStreak15 from './assets/icons/badge-streak-15.png'
import badgeNinja3 from './assets/icons/badge-ninja-3.png'
import badgeNinja8 from './assets/icons/badge-ninja-8.png'
import badgeLightning from './assets/icons/badge-lightning.png'
import badgeLightning3 from './assets/icons/badge-lightning-3.png'
import badgePerfect from './assets/icons/badge-perfect.png'
import badgePerfect3 from './assets/icons/badge-perfect-3.png'
import badgeLongWord from './assets/icons/badge-long-word.png'
import badgeScore500 from './assets/icons/badge-score-500.png'
import badgeScore1000 from './assets/icons/badge-score-1000.png'

export const GOAL_ICON_BY_ID: Record<string, string> = {
  'complete-all': goalComplete,
  'solve-15': goalComplete,
  'streak-5': goalStreak,
  'ninja-3': goalNinja,
  'lightning-1': goalSpeed,
  'lightning-3': goalSpeed,
  'score-500': goalScore,
}

export const BADGE_ICON_BY_ID: Record<string, string> = {
  'streak-5': badgeStreak5,
  'streak-10': badgeStreak10,
  'streak-15': badgeStreak15,
  'ninja-3': badgeNinja3,
  'ninja-8': badgeNinja8,
  lightning: badgeLightning,
  'lightning-3': badgeLightning3,
  perfect: badgePerfect,
  'perfect-3': badgePerfect3,
  'long-word': badgeLongWord,
  'score-500': badgeScore500,
  'score-1000': badgeScore1000,
}

export const UPGRADE_ICON_BY_ID: Record<string, string> = {
  'streak-boost': badgeStreak5,
  'ninja-fury': badgeNinja3,
  'speed-demon': badgeLightning,
}

export const BONUS_ICONS = {
  streak: goalStreak,
  ninja: goalNinja,
  speed: goalSpeed,
} as const

export function goalIcon(id: string): string | undefined {
  return GOAL_ICON_BY_ID[id]
}

export function badgeIcon(id: string): string | undefined {
  return BADGE_ICON_BY_ID[id]
}

export function upgradeIcon(id: string): string | undefined {
  return UPGRADE_ICON_BY_ID[id]
}
