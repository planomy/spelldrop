import type { FallingLetter } from './types'
import { getFallSpeedMultiplier } from './dropSpeed'
import type { DropSpeed } from './types'

export interface MathProblem {
  id: string
  a: number
  b: number
  answer: number
}

export function createMathProblem(tables: number[]): MathProblem {
  const a = tables[Math.floor(Math.random() * tables.length)]
  const b = 1 + Math.floor(Math.random() * 12)
  return {
    id: `p-${a}x${b}-${Date.now()}`,
    a,
    b,
    answer: a * b,
  }
}

function pickSpawnValue(problem: MathProblem, tables: number[]): number {
  const roll = Math.random()
  if (roll < 0.48) return problem.answer

  if (roll < 0.62) {
    const offset = (1 + Math.floor(Math.random() * 4)) * (Math.random() < 0.5 ? -1 : 1)
    const near = problem.answer + offset
    if (near > 0 && near !== problem.answer) return near
  }

  const table = tables[Math.floor(Math.random() * tables.length)]
  const other = 1 + Math.floor(Math.random() * 12)
  return table * other
}

export function createSpawnedMathNumber(
  problem: MathProblem,
  tables: number[],
  containerWidth: number,
  dropSpeed: DropSpeed,
): FallingLetter {
  const value = pickSpawnValue(problem, tables)
  const char = String(value)
  const padding = 56
  const usable = Math.max(containerWidth - padding * 2, 200)
  const speedMul = getFallSpeedMultiplier(dropSpeed)

  return {
    id: `${char}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    char,
    x: padding + Math.random() * usable,
    y: -60 - Math.random() * 120,
    speed: (0.45 + Math.random() * 0.55) * speedMul,
    rotation: (Math.random() - 0.5) * 18,
    wobble: Math.random() * Math.PI * 2,
  }
}

export function createMathBurst(
  problem: MathProblem,
  tables: number[],
  containerWidth: number,
  dropSpeed: DropSpeed,
  count = 5,
): FallingLetter[] {
  return Array.from({ length: count }, (_, i) => {
    const item = createSpawnedMathNumber(problem, tables, containerWidth, dropSpeed)
    return { ...item, y: -60 - i * 90 - Math.random() * 40 }
  })
}

export function formatProblem(problem: MathProblem): string {
  return `${problem.a} × ${problem.b}`
}
