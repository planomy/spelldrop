export interface Badge {
  id: string
  name: string
  description: string
}

export interface Upgrade {
  id: string
  name: string
  description: string
  unlockBadgeId: string
}

export interface Goal {
  id: string
  label: string
}

export interface SessionStats {
  letterStreak: number
  bestLetterStreak: number
  ninjaCaptures: number
  tapCaptures: number
  lightningWords: number
  perfectWords: number
  wordsCompleted: number
  wrongHitsThisWord: number
  perfectWordStreak: number
  bestPerfectStreak: number
  longestWord: number
  streakBonusTotal: number
  ninjaBonusTotal: number
  speedBonusTotal: number
}

export type BadgeGameMode = 'spell' | 'math'

export interface PlayerProgress {
  unlockedBadges: string[]
  unlockedUpgrades: string[]
  totalGamesPlayed: number
  lifetimeScore: number
  highScore: number
}

export const BADGES: Badge[] = [
  { id: 'streak-5', name: 'On Fire', description: '10 letter streak' },
  { id: 'streak-10', name: 'Unstoppable', description: '20 letter streak' },
  { id: 'streak-15', name: 'Legendary', description: '35 letter streak' },
  { id: 'ninja-3', name: 'Shadow Catcher', description: '5 ninja swipes in one game' },
  { id: 'ninja-8', name: 'Ninja Master', description: '12 ninja swipes in one game' },
  { id: 'lightning', name: 'Speed Demon', description: 'Lightning-fast finish' },
  { id: 'lightning-3', name: 'Storm Chaser', description: '5 lightning-fast finishes' },
  { id: 'perfect', name: 'Flawless', description: 'Perfect word — no mistakes' },
  { id: 'perfect-3', name: 'Perfectionist', description: '5 perfect words in a row' },
  { id: 'long-word', name: 'Big Brain', description: 'Spell an 8+ letter word' },
  { id: 'score-500', name: 'Word Warrior', description: '750+ points in one game' },
  { id: 'score-1000', name: 'Spelling Champion', description: '1500+ points in one game' },
]

export const UPGRADES: Upgrade[] = [
  { id: 'streak-boost', name: 'Streak Boost', description: '+5 pts per streak level', unlockBadgeId: 'streak-5' },
  { id: 'ninja-fury', name: 'Ninja Fury', description: '+30 pts per ninja swipe', unlockBadgeId: 'ninja-3' },
  { id: 'speed-demon', name: 'Speed Demon', description: '+15% on lightning words', unlockBadgeId: 'lightning' },
]

const STORAGE_KEY = 'spelldrop-progress'

export function createSessionStats(): SessionStats {
  return {
    letterStreak: 0,
    bestLetterStreak: 0,
    ninjaCaptures: 0,
    tapCaptures: 0,
    lightningWords: 0,
    perfectWords: 0,
    wordsCompleted: 0,
    wrongHitsThisWord: 0,
    perfectWordStreak: 0,
    bestPerfectStreak: 0,
    longestWord: 0,
    streakBonusTotal: 0,
    ninjaBonusTotal: 0,
    speedBonusTotal: 0,
  }
}

function normalizeProgress(raw: Partial<PlayerProgress>): PlayerProgress {
  return {
    unlockedBadges: raw.unlockedBadges ?? [],
    unlockedUpgrades: raw.unlockedUpgrades ?? [],
    totalGamesPlayed: raw.totalGamesPlayed ?? 0,
    lifetimeScore: raw.lifetimeScore ?? 0,
    highScore: raw.highScore ?? 0,
  }
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeProgress(JSON.parse(raw) as Partial<PlayerProgress>)
  } catch { /* ignore */ }
  return normalizeProgress({})
}

export function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)))
  } catch { /* ignore */ }
}

export function recordGameEnd(
  progress: PlayerProgress,
  sessionBadges: string[],
  sessionUpgrades: string[],
  score: number,
): PlayerProgress {
  return normalizeProgress({
    unlockedBadges: [...new Set([...progress.unlockedBadges, ...sessionBadges])],
    unlockedUpgrades: [...new Set([...progress.unlockedUpgrades, ...sessionUpgrades])],
    totalGamesPlayed: progress.totalGamesPlayed + 1,
    lifetimeScore: progress.lifetimeScore + score,
    highScore: Math.max(progress.highScore, score),
  })
}

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}

export function getUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id)
}

export function buildGoals(wordCount: number): Goal[] {
  return [
    { id: 'complete-all', label: `Spell all ${wordCount} words` },
    { id: 'streak-5', label: 'Hit a 5 letter streak' },
    { id: 'ninja-3', label: 'Ninja swipe 3 letters' },
    { id: 'lightning-1', label: 'Get a lightning-fast word' },
    { id: 'score-500', label: 'Score 500+ points' },
  ]
}

export function buildMathGoals(): Goal[] {
  return [
    { id: 'solve-15', label: 'Solve 15 problems' },
    { id: 'streak-5', label: 'Hit a 5 answer streak' },
    { id: 'ninja-3', label: 'Ninja swipe 3 answers' },
    { id: 'lightning-3', label: '3 lightning-fast answers' },
    { id: 'score-500', label: 'Score 500+ points' },
  ]
}

export function isGoalComplete(goalId: string, stats: SessionStats, wordCount: number, score: number): boolean {
  switch (goalId) {
    case 'complete-all': return stats.wordsCompleted >= wordCount
    case 'solve-15': return stats.wordsCompleted >= 15
    case 'streak-5': return stats.bestLetterStreak >= 5
    case 'ninja-3': return stats.ninjaCaptures >= 3
    case 'lightning-1': return stats.lightningWords >= 1
    case 'lightning-3': return stats.lightningWords >= 3
    case 'score-500': return score >= 500
    default: return false
  }
}

export function checkBadges(
  stats: SessionStats,
  score: number,
  alreadyUnlocked: string[],
  mode: BadgeGameMode,
): string[] {
  const earned: string[] = []
  const tryAward = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.includes(id) && !earned.includes(id)) earned.push(id)
  }

  if (mode === 'spell') {
    tryAward('streak-5', stats.bestLetterStreak >= 10)
    tryAward('streak-10', stats.bestLetterStreak >= 20)
    tryAward('streak-15', stats.bestLetterStreak >= 35)
    tryAward('ninja-3', stats.ninjaCaptures >= 5)
    tryAward('ninja-8', stats.ninjaCaptures >= 12)
    tryAward('lightning', stats.lightningWords >= 1)
    tryAward('lightning-3', stats.lightningWords >= 5)
    tryAward('perfect', stats.perfectWords >= 1)
    tryAward('perfect-3', stats.bestPerfectStreak >= 5)
    tryAward('long-word', stats.longestWord >= 8)
    tryAward('score-500', score >= 750)
    tryAward('score-1000', score >= 1500)
    return earned
  }

  tryAward('streak-5', stats.bestPerfectStreak >= 8)
  tryAward('streak-10', stats.bestPerfectStreak >= 15)
  tryAward('streak-15', stats.bestPerfectStreak >= 25)
  tryAward('ninja-3', stats.ninjaCaptures >= 6)
  tryAward('ninja-8', stats.ninjaCaptures >= 15)
  tryAward('lightning', stats.lightningWords >= 1)
  tryAward('lightning-3', stats.lightningWords >= 8)
  tryAward('score-500', score >= 600)
  tryAward('score-1000', score >= 1200)

  return earned
}

export function unlockUpgradesForBadges(
  badgeIds: string[],
  currentUpgrades: string[],
): string[] {
  const newOnes: string[] = []
  for (const upgrade of UPGRADES) {
    if (
      badgeIds.includes(upgrade.unlockBadgeId) &&
      !currentUpgrades.includes(upgrade.id) &&
      !newOnes.includes(upgrade.id)
    ) {
      newOnes.push(upgrade.id)
    }
  }
  return newOnes
}

export function calcStreakBonus(streak: number, upgrades: string[]): number {
  if (!upgrades.includes('streak-boost') || streak < 2) return 0
  return Math.min(streak * 5, 50)
}

export function calcNinjaBonus(upgrades: string[]): number {
  return upgrades.includes('ninja-fury') ? 30 : 0
}

export function calcSpeedBonus(basePoints: number, isLightning: boolean, upgrades: string[]): number {
  if (!isLightning || !upgrades.includes('speed-demon')) return 0
  return Math.round(basePoints * 0.15)
}

export function recordCorrectCapture(
  stats: SessionStats,
  ninja: boolean,
  upgrades: string[],
): { stats: SessionStats; streakBonus: number; ninjaBonus: number } {
  const letterStreak = stats.letterStreak + 1
  const streakBonus = calcStreakBonus(letterStreak, upgrades)
  const ninjaBonus = ninja ? calcNinjaBonus(upgrades) : 0

  return {
    stats: {
      ...stats,
      letterStreak,
      bestLetterStreak: Math.max(stats.bestLetterStreak, letterStreak),
      ninjaCaptures: ninja ? stats.ninjaCaptures + 1 : stats.ninjaCaptures,
      tapCaptures: ninja ? stats.tapCaptures : stats.tapCaptures + 1,
      streakBonusTotal: stats.streakBonusTotal + streakBonus,
      ninjaBonusTotal: stats.ninjaBonusTotal + ninjaBonus,
    },
    streakBonus,
    ninjaBonus,
  }
}

export function recordWrongHit(stats: SessionStats): SessionStats {
  return {
    ...stats,
    letterStreak: 0,
    wrongHitsThisWord: stats.wrongHitsThisWord + 1,
    perfectWordStreak: 0,
  }
}

export function recordWordComplete(
  stats: SessionStats,
  wordLength: number,
  elapsedMs: number,
  baseWordPoints: number,
  upgrades: string[],
): { stats: SessionStats; speedBonus: number; totalWordPoints: number } {
  const isLightning = elapsedMs < 3000
  const isPerfect = stats.wrongHitsThisWord === 0
  const speedBonus = calcSpeedBonus(baseWordPoints, isLightning, upgrades)
  const totalWordPoints = baseWordPoints + speedBonus
  const perfectWordStreak = isPerfect ? stats.perfectWordStreak + 1 : 0

  return {
    stats: {
      ...stats,
      wordsCompleted: stats.wordsCompleted + 1,
      lightningWords: isLightning ? stats.lightningWords + 1 : stats.lightningWords,
      perfectWords: isPerfect ? stats.perfectWords + 1 : stats.perfectWords,
      perfectWordStreak,
      bestPerfectStreak: Math.max(stats.bestPerfectStreak, perfectWordStreak),
      longestWord: Math.max(stats.longestWord, wordLength),
      wrongHitsThisWord: 0,
      speedBonusTotal: stats.speedBonusTotal + speedBonus,
    },
    speedBonus,
    totalWordPoints,
  }
}

export function recordProblemComplete(
  stats: SessionStats,
  elapsedMs: number,
  basePoints: number,
  upgrades: string[],
): { stats: SessionStats; speedBonus: number; totalPoints: number } {
  const isLightning = elapsedMs < 2500
  const isPerfect = stats.wrongHitsThisWord === 0
  const speedBonus = calcSpeedBonus(basePoints, isLightning, upgrades)
  const totalPoints = basePoints + speedBonus
  const perfectStreak = isPerfect ? stats.perfectWordStreak + 1 : 0

  return {
    stats: {
      ...stats,
      wordsCompleted: stats.wordsCompleted + 1,
      lightningWords: isLightning ? stats.lightningWords + 1 : stats.lightningWords,
      perfectWordStreak: perfectStreak,
      bestPerfectStreak: Math.max(stats.bestPerfectStreak, perfectStreak),
      wrongHitsThisWord: 0,
      speedBonusTotal: stats.speedBonusTotal + speedBonus,
    },
    speedBonus,
    totalPoints,
  }
}
