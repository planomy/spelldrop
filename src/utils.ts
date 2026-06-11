import type { DropSpeed, FallingLetter } from './types'
import { getFallSpeedMultiplier } from './dropSpeed'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
export const MAX_FALLING_LETTERS = 14
export const SPAWN_INTERVAL_MS = 650

export function parseWordList(input: string): string[] {
  return input
    .split(',')
    .map((w) => w.trim().toLowerCase().replace(/[^a-z]/g, ''))
    .filter((w) => w.length > 0)
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickSpawnChar(word: string, nextIndex: number): string {
  const next = word[nextIndex]
  if (!next) return ALPHABET[Math.floor(Math.random() * 26)]

  const roll = Math.random()
  if (roll < 0.5) return next
  if (roll < 0.55) {
    const otherWordLetters = [...new Set(word.split(''))].filter((c) => c !== next)
    if (otherWordLetters.length > 0) {
      return otherWordLetters[Math.floor(Math.random() * otherWordLetters.length)]
    }
  }

  let decoy = ALPHABET[Math.floor(Math.random() * 26)]
  let attempts = 0
  while (decoy === next && attempts < 4) {
    decoy = ALPHABET[Math.floor(Math.random() * 26)]
    attempts++
  }
  return decoy
}

export function createSpawnedLetter(
  word: string,
  nextLetterIndex: number,
  containerWidth: number,
  dropSpeed: DropSpeed = 'normal',
): FallingLetter {
  const char = pickSpawnChar(word, nextLetterIndex)
  const padding = 56
  const usable = Math.max(containerWidth - padding * 2, 200)
  const speedMul = getFallSpeedMultiplier(dropSpeed)

  return {
    id: `${char}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    char,
    x: padding + Math.random() * usable,
    y: -60 - Math.random() * 120,
    speed: (0.45 + Math.random() * 0.55) * speedMul,
    rotation: (Math.random() - 0.5) * 30,
    wobble: Math.random() * Math.PI * 2,
  }
}

export function createInitialBurst(
  word: string,
  nextLetterIndex: number,
  containerWidth: number,
  dropSpeed: DropSpeed = 'normal',
  count = 5,
): FallingLetter[] {
  return Array.from({ length: count }, (_, i) => {
    const letter = createSpawnedLetter(word, nextLetterIndex, containerWidth, dropSpeed)
    return { ...letter, y: -60 - i * 90 - Math.random() * 40 }
  })
}

export function calculateWordScore(elapsedMs: number, wordLength: number): number {
  const seconds = elapsedMs / 1000
  const base = wordLength * 100
  const timeBonus = Math.max(50, Math.round(600 - seconds * 45))
  return base + timeBonus
}

export function getSpeedLabel(elapsedMs: number): string {
  const seconds = elapsedMs / 1000
  if (seconds < 4) return 'Lightning!'
  if (seconds < 7) return 'Super fast!'
  if (seconds < 11) return 'Nice work!'
  return 'Keep practising!'
}

export function countTotalLetters(words: string[]): number {
  return words.reduce((sum, w) => sum + w.length, 0)
}

export function playSound(type: 'correct' | 'wrong' | 'complete' | 'pop') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.15, now)

    if (type === 'correct') {
      osc.frequency.setValueAtTime(523, now)
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'wrong') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'complete') {
      ;[523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        const t = now + i * 0.12
        o.frequency.setValueAtTime(freq, t)
        g.gain.setValueAtTime(0.12, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        o.start(t)
        o.stop(t + 0.25)
      })
    } else {
      osc.frequency.setValueAtTime(440, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.start(now)
      osc.stop(now + 0.08)
    }
  } catch {
    // Audio not available
  }
}
