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
import speedChill from './assets/icons/speed-chill.png'
import speedNormal from './assets/icons/speed-normal.png'
import speedFast from './assets/icons/speed-fast.png'
import speedTurbo from './assets/icons/speed-turbo.png'
import uiSpelling from './assets/icons/ui-spelling.png'
import uiTimesTables from './assets/icons/ui-times-tables.png'
import uiLeaderboard from './assets/icons/ui-leaderboard.png'
import uiChallenges from './assets/icons/ui-challenges.png'
import uiPractice from './assets/icons/ui-practice.png'
import uiAchievements from './assets/icons/ui-achievements.png'
import uiStreaks from './assets/icons/ui-streaks.png'
import uiBrainBoost from './assets/icons/ui-brain-boost.png'
import uiRewards from './assets/icons/ui-rewards.png'
import uiProgress from './assets/icons/ui-progress.png'
import uiQuickPlay from './assets/icons/ui-quick-play.png'
import uiTopics from './assets/icons/ui-topics.png'
import uiHotStreak from './assets/icons/ui-hot-streak.png'
import uiDailyGoals from './assets/icons/ui-daily-goals.png'
import uiSettings from './assets/icons/ui-settings.png'
import type { DropSpeed, GameMode } from './types'

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

export const SPEED_ICON_BY_ID: Record<DropSpeed, string> = {
  chill: speedChill,
  normal: speedNormal,
  fast: speedFast,
  turbo: speedTurbo,
}

export const MODE_ICONS: Record<GameMode, string> = {
  spell: uiSpelling,
  math: uiTimesTables,
}

export const STREAK_TIER_ICONS = {
  warm: uiStreaks,
  hot: uiHotStreak,
  legendary: badgeStreak15,
} as const

export const UI_ICONS = {
  spelling: uiSpelling,
  timesTables: uiTimesTables,
  leaderboard: uiLeaderboard,
  challenges: uiChallenges,
  practice: uiPractice,
  achievements: uiAchievements,
  streaks: uiStreaks,
  brainBoost: uiBrainBoost,
  rewards: uiRewards,
  progress: uiProgress,
  quickPlay: uiQuickPlay,
  topics: uiTopics,
  hotStreak: uiHotStreak,
  dailyGoals: uiDailyGoals,
  settings: uiSettings,
} as const

export const SETUP_ICONS = {
  badges: uiAchievements,
  upgrades: uiRewards,
  best: uiLeaderboard,
  lifetime: uiProgress,
} as const

export const GOAL_ICONS_PREVIEW = [
  { src: goalComplete, label: 'Complete' },
  { src: goalStreak, label: 'Streak' },
  { src: goalNinja, label: 'Ninja' },
  { src: goalSpeed, label: 'Speed' },
  { src: goalScore, label: 'Score' },
] as const

export function goalIcon(id: string): string | undefined {
  return GOAL_ICON_BY_ID[id]
}

export function badgeIcon(id: string): string | undefined {
  return BADGE_ICON_BY_ID[id]
}

export function upgradeIcon(id: string): string | undefined {
  return UPGRADE_ICON_BY_ID[id]
}
