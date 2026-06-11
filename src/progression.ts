export interface Badge {
  id: string
  name: string
  emoji: string
  description: string
}

export interface Upgrade {
  id: string
  name: string
  emoji: string
  description: string
  unlockBadgeId: string
}

export interface Goal {
  id: string
  label: string
  emoji: string
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
  longestWord: number
  streakBonusTotal: number
  ninjaBonusTotal: number
  speedBonusTotal: number
}

export interface PlayerProgress {
  unlockedBadges: string[]
  unlockedUpgrades: string[]
  totalGamesPlayed: number
  lifetimeScore: number
  highScore: number
}

export const BADGES: Badge[] = [
  { id: 'streak-5', name: 'On Fire', emoji: '🔥', description: '5 letter streak' },
  { id: 'streak-10', name: 'Unstoppable', emoji: '⚡', description: '10 letter streak' },
  { id: 'streak-15', name: 'Legendary', emoji: '👑', description: '15 letter streak' },
  { id: 'ninja-3', name: 'Shadow Catcher', emoji: '🥷', description: '3 ninja swipes' },
  { id: 'ninja-8', name: 'Ninja Master', emoji: '🗡️', description: '8 ninja swipes' },
  { id: 'lightning', name: 'Speed Demon', emoji: '💨', description: 'Lightning-fast word' },
  { id: 'lightning-3', name: 'Storm Chaser', emoji: '🌩️', description: '3 lightning words' },
  { id: 'perfect', name: 'Flawless', emoji: '✨', description: 'Perfect word — no mistakes' },
  { id: 'perfect-3', name: 'Perfectionist', emoji: '💎', description: '3 perfect words in a row' },
  { id: 'long-word', name: 'Big Brain', emoji: '🧠', description: 'Spell an 8+ letter word' },
  { id: 'score-500', name: 'Word Warrior', emoji: '🏅', description: '500+ points in one game' },
  { id: 'score-1000', name: 'Spelling Champion', emoji: '🏆', description: '1000+ points in one game' },
]

export const UPGRADES: Upgrade[] = [
  { id: 'streak-boost', name: 'Streak Boost', emoji: '🔥', description: '+5 pts per streak level', unlockBadgeId: 'streak-5' },
  { id: 'ninja-fury', name: 'Ninja Fury', emoji: '🥷', description: '+30 pts per ninja swipe', unlockBadgeId: 'ninja-3' },
  { id: 'speed-demon', name: 'Speed Demon', emoji: '💨', description: '+15% on lightning words', unlockBadgeId: 'lightning' },
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
    { id: 'complete-all', label: `Spell all ${wordCount} words`, emoji: '🎯' },
    { id: 'streak-5', label: 'Hit a 5 letter streak', emoji: '🔥' },
    { id: 'ninja-3', label: 'Ninja swipe 3 letters', emoji: '🥷' },
    { id: 'lightning-1', label: 'Get a lightning-fast word', emoji: '💨' },
    { id: 'score-500', label: 'Score 500+ points', emoji: '🏅' },
  ]
}

export function buildMathGoals(): Goal[] {
  return [
    { id: 'solve-15', label: 'Solve 15 problems', emoji: '🎯' },
    { id: 'streak-5', label: 'Hit a 5 answer streak', emoji: '🔥' },
    { id: 'ninja-3', label: 'Ninja swipe 3 answers', emoji: '🥷' },
    { id: 'lightning-3', label: '3 lightning-fast answers', emoji: '💨' },
    { id: 'score-500', label: 'Score 500+ points', emoji: '🏅' },
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
): string[] {
  const earned: string[] = []
  const tryAward = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.includes(id) && !earned.includes(id)) earned.push(id)
  }

  tryAward('streak-5', stats.bestLetterStreak >= 5)
  tryAward('streak-10', stats.bestLetterStreak >= 10)
  tryAward('streak-15', stats.bestLetterStreak >= 15)
  tryAward('ninja-3', stats.ninjaCaptures >= 3)
  tryAward('ninja-8', stats.ninjaCaptures >= 8)
  tryAward('lightning', stats.lightningWords >= 1)
  tryAward('lightning-3', stats.lightningWords >= 3)
  tryAward('perfect', stats.perfectWords >= 1)
  tryAward('perfect-3', stats.perfectWordStreak >= 3)
  tryAward('long-word', stats.longestWord >= 8)
  tryAward('score-500', score >= 500)
  tryAward('score-1000', score >= 1000)

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
  const isLightning = elapsedMs < 4000
  const isPerfect = stats.wrongHitsThisWord === 0
  const speedBonus = calcSpeedBonus(baseWordPoints, isLightning, upgrades)
  const totalWordPoints = baseWordPoints + speedBonus

  return {
    stats: {
      ...stats,
      wordsCompleted: stats.wordsCompleted + 1,
      lightningWords: isLightning ? stats.lightningWords + 1 : stats.lightningWords,
      perfectWords: isPerfect ? stats.perfectWords + 1 : stats.perfectWords,
      perfectWordStreak: isPerfect ? stats.perfectWordStreak + 1 : 0,
      longestWord: Math.max(stats.longestWord, wordLength),
      wrongHitsThisWord: 0,
      speedBonusTotal: stats.speedBonusTotal + speedBonus,
    },
    speedBonus,
    totalWordPoints,
  }
}
