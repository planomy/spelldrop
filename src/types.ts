export interface GameSettings {
  previewSeconds: number
}

export interface FallingLetter {
  id: string
  char: string
  x: number
  y: number
  speed: number
  rotation: number
  wobble: number
}

export interface WordScorePopup {
  points: number
  id: number
}

export interface FlyingLetterAnim {
  char: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  slotIndex: number
  id: number
}

export interface CaptureParticle {
  id: string
  x: number
  y: number
  angle: number
}

export interface SwipeTrail {
  id: number
  points: { x: number; y: number }[]
  fading: boolean
}

export interface LetterDestroyAnim {
  id: string
  char: string
  x: number
  y: number
  rotation: number
  type: 'explode' | 'slice'
  slashAngle: number
}

export type GamePhase = 'preview' | 'playing' | 'word-complete' | 'all-complete'

export interface GameState {
  words: string[]
  currentWordIndex: number
  currentLetterIndex: number
  phase: GamePhase
  fallingLetters: FallingLetter[]
  placedLetters: string[]
  totalLetters: number
  correctLetters: number
  wrongFlash: boolean
  celebrate: boolean
}
