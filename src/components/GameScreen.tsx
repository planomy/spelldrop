import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProgressMeter from './ProgressMeter'
import StreakBanner from './StreakBanner'
import GoalsBar from './GoalsBar'
import BadgeToast from './BadgeToast'
import FinalTally from './FinalTally'
import type { SpellSettings, FallingLetter, GamePhase, WordScorePopup, FlyingLetterAnim, CaptureParticle, SwipeTrail, LetterDestroyAnim } from '../types'
import { getSpawnIntervalMs } from '../dropSpeed'
import {
  createSessionStats,
  loadProgress,
  recordGameEnd,
  saveProgress,
  buildGoals,
  checkBadges,
  unlockUpgradesForBadges,
  recordCorrectCapture,
  recordWrongHit,
  recordWordComplete,
  type SessionStats,
  type PlayerProgress,
  type Goal,
} from '../progression'
import {
  createInitialBurst,
  createSpawnedLetter,
  calculateWordScore,
  getSpeedLabel,
  countTotalLetters,
  playSound,
  MAX_FALLING_LETTERS,
  SPAWN_INTERVAL_MS,
} from '../utils'
import { SWIPE_THRESHOLD, TRAIL_MIN_DIST, buildTrailPath, toStageCoords } from '../swipeTrail'
import './GameScreen.css'

const WRONG_LETTER_PENALTY = 10
const RANDOM_SWIPE_PENALTY = 15
const WORD_HINT_PENALTY = 25
const WORD_HINT_SECONDS = 1.5

interface SwipeGesture {
  active: boolean
  ended: boolean
  isSwipe: boolean
  hitLetter: boolean
  pointerId: number
  startX: number
  startY: number
  hitIds: Set<string>
  wrongTriggered: boolean
  trailId: number | null
  lastTrailX: number
  lastTrailY: number
  lastClientX: number
  lastClientY: number
}

interface SlotsMessage {
  text: string
  tone: 'bonus' | 'penalty'
}

interface Props {
  words: string[]
  settings: SpellSettings
  onBack: () => void
}

export default function GameScreen({ words, settings, onBack }: Props) {
  const [wordIndex, setWordIndex] = useState(0)
  const [letterIndex, setLetterIndex] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('preview')
  const [fallingLetters, setFallingLetters] = useState<FallingLetter[]>([])
  const [placedLetters, setPlacedLetters] = useState<string[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [previewCountdown, setPreviewCountdown] = useState(settings.previewSeconds)
  const [flyingLetter, setFlyingLetter] = useState<FlyingLetterAnim | null>(null)
  const [captureParticles, setCaptureParticles] = useState<CaptureParticle[]>([])
  const [captureRing, setCaptureRing] = useState<{ x: number; y: number; id: number } | null>(null)
  const [landingSlot, setLandingSlot] = useState<number | null>(null)
  const [successPulse, setSuccessPulse] = useState(false)
  const [score, setScore] = useState(0)
  const [wordScorePopup, setWordScorePopup] = useState<WordScorePopup | null>(null)
  const [lastSpeedLabel, setLastSpeedLabel] = useState('')
  const [swipeTrails, setSwipeTrails] = useState<SwipeTrail[]>([])
  const [destroyingLetters, setDestroyingLetters] = useState<LetterDestroyAnim[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats>(createSessionStats)
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(loadProgress)
  const [sessionBadges, setSessionBadges] = useState<string[]>([])
  const [sessionUpgrades, setSessionUpgrades] = useState<string[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [badgeToast, setBadgeToast] = useState<string | null>(null)
  const [bonusPopup, setBonusPopup] = useState<string | null>(null)
  const [slotsMessage, setSlotsMessage] = useState<SlotsMessage | null>(null)
  const [wordHintActive, setWordHintActive] = useState(false)
  const [wordHintCountdown, setWordHintCountdown] = useState(0)

  const gameStageRef = useRef<HTMLDivElement>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const animFrameRef = useRef<number>(0)
  const wordStartTimeRef = useRef(0)
  const popupIdRef = useRef(0)
  const flyingIdRef = useRef(0)
  const pendingLetterRef = useRef<string | null>(null)
  const landingHandledRef = useRef(false)
  const trailIdRef = useRef(0)
  const swipeRef = useRef<SwipeGesture>({
    active: false,
    ended: false,
    isSwipe: false,
    hitLetter: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    hitIds: new Set(),
    wrongTriggered: false,
    trailId: null,
    lastTrailX: 0,
    lastTrailY: 0,
    lastClientX: 0,
    lastClientY: 0,
  })
  const totalLetters = countTotalLetters(words)
  const currentWord = words[wordIndex] ?? ''
  const fallingLettersRef = useRef(fallingLetters)
  const gameStateRef = useRef({
    fallingLetters,
    letterIndex,
    phase,
    flyingLetter,
    currentWord,
  })
  const progressPercent = totalLetters > 0 ? (correctCount / totalLetters) * 100 : 0
  const processMoveRef = useRef<(clientX: number, clientY: number, pointerId: number) => void>(() => {})
  const processUpRef = useRef<(clientX: number, clientY: number, pointerId: number) => void>(() => {})

  const startWord = useCallback(() => {
    setLetterIndex(0)
    gameStateRef.current.letterIndex = 0
    setPlacedLetters([])
    setFallingLetters([])
    gameStateRef.current.phase = 'preview'
    setPhase('preview')
    setPreviewCountdown(settings.previewSeconds)
    setCelebrate(false)
    setFlyingLetter(null)
    setCaptureParticles([])
    setCaptureRing(null)
    setLandingSlot(null)
    setSuccessPulse(false)
    setWordScorePopup(null)
    pendingLetterRef.current = null
    landingHandledRef.current = false
    gameStateRef.current.flyingLetter = null
    setSwipeTrails([])
    setDestroyingLetters([])
    setWordHintActive(false)
    setWordHintCountdown(0)
    setSlotsMessage(null)
  }, [settings.previewSeconds])

  function showSlotsMessage(text: string, tone: 'bonus' | 'penalty') {
    setSlotsMessage({ text, tone })
    window.setTimeout(() => setSlotsMessage(null), 900)
  }

  function applyScorePenalty(amount: number) {
    setScore((s) => Math.max(0, s - amount))
  }

  function penalizeWrongLetter() {
    const nextStats = recordWrongHit(sessionStatsRef.current)
    sessionStatsRef.current = nextStats
    setSessionStats(nextStats)
    applyScorePenalty(WRONG_LETTER_PENALTY)
    setBonusPopup(null)
    showSlotsMessage(`−${WRONG_LETTER_PENALTY} wrong letter`, 'penalty')
    setWrongFlash(true)
    playSound('wrong')
    window.setTimeout(() => setWrongFlash(false), 400)
  }

  function penalizeRandomSwipe() {
    const nextStats = recordWrongHit(sessionStatsRef.current)
    sessionStatsRef.current = nextStats
    setSessionStats(nextStats)
    applyScorePenalty(RANDOM_SWIPE_PENALTY)
    showSlotsMessage(`−${RANDOM_SWIPE_PENALTY} wild swipe`, 'penalty')
    setWrongFlash(true)
    playSound('wrong')
    window.setTimeout(() => setWrongFlash(false), 400)
  }

  function handleShowWordAgain() {
    if (gameStateRef.current.phase !== 'playing' || gameStateRef.current.flyingLetter || wordHintActive) {
      return
    }
    applyScorePenalty(WORD_HINT_PENALTY)
    showSlotsMessage(`−${WORD_HINT_PENALTY} word peek`, 'penalty')
    setWordHintActive(true)
    setWordHintCountdown(WORD_HINT_SECONDS)
  }

  const savedRef = useRef(false)

  useEffect(() => {
    savedRef.current = false
    setGoals(buildGoals(words.length))
    setSessionStats(createSessionStats())
    setSessionBadges([])
    setSessionUpgrades([])
    setPlayerProgress(loadProgress())
  }, [words])

  useEffect(() => {
    startWord()
  }, [wordIndex, startWord])

  const progressRef = useRef({ playerProgress, sessionBadges, sessionUpgrades })
  const sessionStatsRef = useRef(sessionStats)
  const activeUpgrades = [...new Set([...playerProgress.unlockedUpgrades, ...sessionUpgrades])]

  useEffect(() => {
    progressRef.current = { playerProgress, sessionBadges, sessionUpgrades }
  }, [playerProgress, sessionBadges, sessionUpgrades])

  useEffect(() => {
    sessionStatsRef.current = sessionStats
  }, [sessionStats])

  function showBadgeToast(id: string) {
    setBadgeToast(id)
    setTimeout(() => setBadgeToast(null), 2800)
  }

  function processNewBadges(stats: SessionStats, currentScore: number) {
    const { playerProgress: pp, sessionBadges: sb, sessionUpgrades: su } = progressRef.current
    const newBadges = checkBadges(stats, currentScore, [...pp.unlockedBadges, ...sb])
    if (newBadges.length === 0) return

    const updatedBadges = [...sb, ...newBadges]
    const newUpgradeIds = unlockUpgradesForBadges(newBadges, [...pp.unlockedUpgrades, ...su])
    const updatedUpgrades = [...su, ...newUpgradeIds]

    setSessionBadges(updatedBadges)
    if (newUpgradeIds.length > 0) setSessionUpgrades(updatedUpgrades)
    progressRef.current = {
      playerProgress: pp,
      sessionBadges: updatedBadges,
      sessionUpgrades: updatedUpgrades,
    }
    showBadgeToast(newBadges[newBadges.length - 1])
  }

  useEffect(() => {
    fallingLettersRef.current = fallingLetters
    gameStateRef.current.fallingLetters = fallingLetters
  }, [fallingLetters])

  useEffect(() => {
    gameStateRef.current.letterIndex = letterIndex
    gameStateRef.current.phase = phase
    gameStateRef.current.currentWord = currentWord
    gameStateRef.current.flyingLetter = flyingLetter
  }, [letterIndex, phase, currentWord, flyingLetter])

  useEffect(() => {
    function onWindowMove(e: PointerEvent) {
      processMoveRef.current(e.clientX, e.clientY, e.pointerId)
    }
    function onWindowUp(e: PointerEvent) {
      processUpRef.current(e.clientX, e.clientY, e.pointerId)
    }
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
    return () => {
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      window.removeEventListener('pointercancel', onWindowUp)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'all-complete' || savedRef.current) return
    savedRef.current = true
    const { playerProgress: pp, sessionBadges: sb, sessionUpgrades: su } = progressRef.current
    saveProgress(recordGameEnd(pp, sb, su, score))
  }, [phase, score])

  // Preview countdown
  useEffect(() => {
    if (phase !== 'preview') return

    if (previewCountdown <= 0) {
      const width = gameAreaRef.current?.clientWidth ?? 600
      const burst = createInitialBurst(currentWord, 0, width, settings.dropSpeed)
      wordStartTimeRef.current = Date.now()
      fallingLettersRef.current = burst
      gameStateRef.current = {
        ...gameStateRef.current,
        phase: 'playing',
        fallingLetters: burst,
        currentWord,
      }
      setFallingLetters(burst)
      setPhase('playing')
      playSound('pop')
      return
    }

    const timer = setTimeout(() => {
      setPreviewCountdown((c) => c - 0.1)
    }, 100)

    return () => clearTimeout(timer)
  }, [phase, previewCountdown, currentWord])

  useEffect(() => {
    if (!wordHintActive || wordHintCountdown <= 0) {
      if (wordHintCountdown <= 0) setWordHintActive(false)
      return
    }

    const timer = window.setTimeout(() => {
      setWordHintCountdown((c) => c - 0.1)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [wordHintActive, wordHintCountdown])

  // Falling animation loop
  useEffect(() => {
    if (phase !== 'playing') return

    const area = gameAreaRef.current
    if (!area) return

    const areaHeight = area.clientHeight

    function tick() {
      setFallingLetters((prev) => {
        const next = prev
          .map((l) => ({
            ...l,
            y: l.y + l.speed * 2,
            wobble: l.wobble + 0.03,
            rotation: l.rotation + Math.sin(l.wobble) * 0.3,
          }))
          .filter((l) => l.y < areaHeight + 100)
        fallingLettersRef.current = next
        gameStateRef.current.fallingLetters = next
        return next
      })
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [phase])

  // Continuous letter spawner
  useEffect(() => {
    if (phase !== 'playing') return

    const interval = setInterval(() => {
      const width = gameAreaRef.current?.clientWidth ?? 600
      setFallingLetters((prev) => {
        if (prev.length >= MAX_FALLING_LETTERS) return prev
        const next = [...prev, createSpawnedLetter(currentWord, letterIndex, width, settings.dropSpeed)]
        fallingLettersRef.current = next
        gameStateRef.current.fallingLetters = next
        return next
      })
    }, getSpawnIntervalMs(settings.dropSpeed, SPAWN_INTERVAL_MS))

    return () => clearInterval(interval)
  }, [phase, currentWord, letterIndex, settings.dropSpeed])

  const lastTapRef = useRef(0)

  function spawnCaptureFx(x: number, y: number, ninja = false) {
    const count = ninja ? 16 : 12
    const particles = Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      x,
      y,
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
    }))
    setCaptureParticles(particles)
    flyingIdRef.current += 1
    setCaptureRing({ x, y, id: flyingIdRef.current })
    setTimeout(() => {
      setCaptureParticles([])
      setCaptureRing(null)
    }, ninja ? 550 : 450)
  }

  function appendTrailPoint(x: number, y: number, trailId: number) {
    setSwipeTrails((prev) =>
      prev.map((t) => {
        if (t.id !== trailId) return t
        const last = t.points[t.points.length - 1]
        if (last && Math.hypot(x - last.x, y - last.y) < TRAIL_MIN_DIST) return t
        return { ...t, points: [...t.points, { x, y }] }
      }),
    )
  }

  function startSwipeTrail(x: number, y: number) {
    trailIdRef.current += 1
    const id = trailIdRef.current
    setSwipeTrails((prev) => [...prev, { id, points: [{ x, y }], fading: false }])
    return id
  }

  function fadeSwipeTrail(trailId: number) {
    setSwipeTrails((prev) =>
      prev.map((t) => (t.id === trailId ? { ...t, fading: true } : t)),
    )
    window.setTimeout(() => {
      setSwipeTrails((prev) => prev.filter((t) => t.id !== trailId))
    }, 380)
  }

  function fadeStaleTrails() {
    setSwipeTrails((prev) => {
      if (prev.length === 0) return prev
      for (const trail of prev) {
        const id = trail.id
        window.setTimeout(() => {
          setSwipeTrails((p) => p.filter((t) => t.id !== id))
        }, 380)
      }
      return prev.map((t) => ({ ...t, fading: true }))
    })
  }

  function resolveSlotEl(slotIdx: number): HTMLDivElement | null {
    const refSlot = slotRefs.current[slotIdx]
    if (refSlot?.isConnected) return refSlot
    const slots = gameStageRef.current?.querySelectorAll<HTMLDivElement>('.game__slot')
    return slots?.[slotIdx] ?? null
  }

  function startFlyingLetter(char: string, fromX: number, fromY: number, slotIdx: number) {
    const stageRect = gameStageRef.current?.getBoundingClientRect()
    const slotEl = resolveSlotEl(slotIdx)
    if (!stageRect || !slotEl) {
      completeLetterPlacement(char)
      return
    }

    const slotRect = slotEl.getBoundingClientRect()
    const toX = slotRect.left - stageRect.left + slotRect.width / 2
    const toY = slotRect.top - stageRect.top + slotRect.height / 2

    pendingLetterRef.current = char
    landingHandledRef.current = false
    flyingIdRef.current += 1
    const flying = {
      char,
      fromX,
      fromY,
      toX,
      toY,
      slotIndex: slotIdx,
      id: flyingIdRef.current,
    }
    gameStateRef.current.flyingLetter = flying
    setFlyingLetter(flying)
  }

  function completeLetterPlacement(char: string) {
    const curIdx = gameStateRef.current.letterIndex
    const word = gameStateRef.current.currentWord
    const nextIndex = curIdx + 1
    setPlacedLetters((prev) => [...prev, char])
    gameStateRef.current.flyingLetter = null
    setFlyingLetter(null)
    setLandingSlot(curIdx)
    setSuccessPulse(true)
    setCorrectCount((c) => c + 1)
    pendingLetterRef.current = null

    setTimeout(() => {
      setLandingSlot(null)
      setSuccessPulse(false)
    }, 500)

    if (nextIndex >= word.length) {
      const elapsed = Date.now() - wordStartTimeRef.current
      const basePoints = calculateWordScore(elapsed, word.length)
      const speedLabel = getSpeedLabel(elapsed)

      const wordResult = recordWordComplete(
        sessionStatsRef.current,
        word.length,
        elapsed,
        basePoints,
        activeUpgrades,
      )
      sessionStatsRef.current = wordResult.stats
      setSessionStats(wordResult.stats)

      const totalWordPoints = wordResult.totalWordPoints
      setScore((s) => {
        const newScore = s + totalWordPoints
        processNewBadges(wordResult.stats, newScore)
        return newScore
      })
      setLastSpeedLabel(speedLabel)
      popupIdRef.current += 1
      setWordScorePopup({ points: totalWordPoints, id: popupIdRef.current })
      setFallingLetters([])
      setPhase('word-complete')
      setCelebrate(true)
      playSound('complete')

      setTimeout(() => {
        if (wordIndex + 1 >= words.length) {
          setPhase('all-complete')
        } else {
          setWordIndex((i) => i + 1)
        }
      }, 1500)
    } else {
      gameStateRef.current.letterIndex = nextIndex
      setLetterIndex(nextIndex)
    }
  }

  function findLetterAt(
    clientX: number,
    clientY: number,
  ): { letter: FallingLetter; fromX: number; fromY: number } | null {
    const area = gameAreaRef.current
    const stageRect = gameStageRef.current?.getBoundingClientRect()
    if (!area || !stageRect) return null

    const pad = 14
    const expected = gameStateRef.current.currentWord[gameStateRef.current.letterIndex]
    const els = area.querySelectorAll<HTMLElement>('.game__falling-letter')
    let fallback: { letter: FallingLetter; fromX: number; fromY: number } | null = null

    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i]
      const rect = el.getBoundingClientRect()
      if (
        clientX < rect.left - pad ||
        clientX > rect.right + pad ||
        clientY < rect.top - pad ||
        clientY > rect.bottom + pad
      ) {
        continue
      }

      const id = el.dataset.letterId
      const letter = id ? fallingLettersRef.current.find((l) => l.id === id) : null
      if (!letter) continue

      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const hit = {
        letter,
        fromX: cx - stageRect.left,
        fromY: cy - stageRect.top,
      }
      if (letter.char === expected) return hit
      if (!fallback) fallback = hit
    }
    return fallback
  }

  function tryCaptureLetter(
    letter: FallingLetter,
    fromX: number,
    fromY: number,
    ninja = false,
    slashAngle = 0,
  ) {
    const { phase: curPhase, letterIndex: curIdx, currentWord: word, flyingLetter: flying } =
      gameStateRef.current
    if (curPhase !== 'playing' || flying) return false

    const now = Date.now()
    if (!ninja && now - lastTapRef.current < 300) return false
    if (!ninja) lastTapRef.current = now

    const expectedChar = word[curIdx]

    if (letter.char !== expectedChar) {
      if (!ninja || !swipeRef.current.wrongTriggered) {
        if (ninja) swipeRef.current.wrongTriggered = true
        penalizeWrongLetter()
      }
      return false
    }

    playSound('correct')

    const captureResult = recordCorrectCapture(sessionStatsRef.current, ninja, activeUpgrades)
    sessionStatsRef.current = captureResult.stats
    setSessionStats(captureResult.stats)

    const captureBonus = captureResult.streakBonus + captureResult.ninjaBonus
    if (captureBonus > 0) {
      setScore((s) => {
        const newScore = s + captureBonus
        processNewBadges(captureResult.stats, newScore)
        return newScore
      })
      const parts: string[] = []
      if (captureResult.streakBonus > 0) parts.push(`+${captureResult.streakBonus} streak`)
      if (captureResult.ninjaBonus > 0) parts.push(`+${captureResult.ninjaBonus} ninja`)
      showSlotsMessage(parts.join(' '), 'bonus')
    } else {
      setScore((s) => {
        processNewBadges(captureResult.stats, s)
        return s
      })
    }

    spawnCaptureFx(fromX, fromY, ninja)
    setSuccessPulse(true)
    setTimeout(() => setSuccessPulse(false), 450)

    setFallingLetters((prev) => {
      const next = prev.filter((l) => l.id !== letter.id)
      fallingLettersRef.current = next
      gameStateRef.current.fallingLetters = next
      return next
    })
    setDestroyingLetters((prev) => [
      ...prev,
      {
        id: letter.id,
        char: letter.char,
        x: letter.x,
        y: letter.y,
        rotation: letter.rotation,
        type: ninja ? 'slice' : 'explode',
        slashAngle,
      },
    ])

    startFlyingLetter(letter.char, fromX, fromY, curIdx)

    const destroyDelay = ninja ? 360 : 280
    setTimeout(() => {
      setDestroyingLetters((prev) => prev.filter((d) => d.id !== letter.id))
    }, destroyDelay)

    return true
  }

  function checkSwipeSegment(x1: number, y1: number, x2: number, y2: number) {
    if (gameStateRef.current.flyingLetter) return

    const dist = Math.hypot(x2 - x1, y2 - y1)
    const steps = Math.max(1, Math.ceil(dist / 8))
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const expected = gameStateRef.current.currentWord[gameStateRef.current.letterIndex]

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const hit = findLetterAt(px, py)
      if (!hit || swipeRef.current.hitIds.has(hit.letter.id)) continue

      swipeRef.current.hitLetter = true

      if (hit.letter.char === expected) {
        if (tryCaptureLetter(hit.letter, hit.fromX, hit.fromY, true, angle)) {
          swipeRef.current.hitIds.add(hit.letter.id)
          return
        }
      } else {
        swipeRef.current.hitIds.add(hit.letter.id)
        tryCaptureLetter(hit.letter, hit.fromX, hit.fromY, true, angle)
      }
    }
  }

  function processPointerMove(clientX: number, clientY: number, pointerId: number) {
    const swipe = swipeRef.current
    if (!swipe.active || swipe.pointerId !== pointerId) return

    const stageRect = gameStageRef.current?.getBoundingClientRect()
    if (!stageRect) return

    const dist = Math.hypot(clientX - swipe.startX, clientY - swipe.startY)
    const { x, y } = toStageCoords(clientX, clientY, stageRect)
    const prevClientX = swipe.lastClientX
    const prevClientY = swipe.lastClientY

    if (!swipe.isSwipe && dist > SWIPE_THRESHOLD) {
      swipe.isSwipe = true
      swipe.trailId = startSwipeTrail(swipe.lastTrailX, swipe.lastTrailY)
      if (swipe.trailId !== null) appendTrailPoint(x, y, swipe.trailId)
      checkSwipeSegment(swipe.startX, swipe.startY, clientX, clientY)
    }

    if (!swipe.isSwipe) return

    if (swipe.trailId !== null) {
      appendTrailPoint(x, y, swipe.trailId)
      swipe.lastTrailX = x
      swipe.lastTrailY = y
    }

    checkSwipeSegment(prevClientX, prevClientY, clientX, clientY)
    swipe.lastClientX = clientX
    swipe.lastClientY = clientY
  }

  function processPointerUp(clientX: number, clientY: number, pointerId: number) {
    const swipe = swipeRef.current
    if (!swipe.active || swipe.ended || swipe.pointerId !== pointerId) return
    swipe.ended = true

    gameAreaRef.current?.releasePointerCapture(pointerId)

    if (swipe.isSwipe) {
      checkSwipeSegment(swipe.lastClientX, swipe.lastClientY, clientX, clientY)
      const swipeDist = Math.hypot(clientX - swipe.startX, clientY - swipe.startY)
      if (!swipe.hitLetter && swipeDist > SWIPE_THRESHOLD) {
        penalizeRandomSwipe()
      }
      if (swipe.trailId !== null) fadeSwipeTrail(swipe.trailId)
    } else {
      const hit = findLetterAt(clientX, clientY)
      if (hit) tryCaptureLetter(hit.letter, hit.fromX, hit.fromY, false)
    }

    swipeRef.current.active = false
  }

  function handleAreaPointerDown(e: React.PointerEvent) {
    if (gameStateRef.current.phase !== 'playing') return

    fadeStaleTrails()
    e.currentTarget.setPointerCapture(e.pointerId)

    const stageRect = gameStageRef.current?.getBoundingClientRect()
    if (!stageRect) return

    const { x, y } = toStageCoords(e.clientX, e.clientY, stageRect)

    swipeRef.current = {
      active: true,
      ended: false,
      isSwipe: false,
      hitLetter: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      hitIds: new Set(),
      wrongTriggered: false,
      trailId: null,
      lastTrailX: x,
      lastTrailY: y,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
    }
  }

  processMoveRef.current = processPointerMove
  processUpRef.current = processPointerUp

  function handleFlyingComplete() {
    if (!pendingLetterRef.current || landingHandledRef.current) return
    landingHandledRef.current = true
    completeLetterPlacement(pendingLetterRef.current)
  }

  return (
    <div ref={gameStageRef} className="game">
      <div className="game__hud">
        <button className="game__back" onClick={onBack} aria-label="Back to setup">
          ←
        </button>
        <div className="game__hud-body">
          <div className="game__hud-row">
            <span className="game__hud-word">{wordIndex + 1}/{words.length}</span>
            <StreakBanner streak={sessionStats.letterStreak} compact />
            {phase === 'playing' && (
              <GoalsBar
                variant="header"
                goals={goals}
                stats={sessionStats}
                wordCount={words.length}
                score={score}
              />
            )}
            <span className="game__hud-score">{score.toLocaleString()}</span>
          </div>
          <ProgressMeter
            compact
            percent={progressPercent}
            correctLetters={correctCount}
            totalLetters={totalLetters}
          />
        </div>
      </div>

      <div className="game__playfield">
        <div className="game__area-wrap">
          <div
            className={`game__area ${wrongFlash ? 'game__area--wrong' : ''} ${successPulse ? 'game__area--success' : ''}`}
            ref={gameAreaRef}
            onPointerDown={handleAreaPointerDown}
            onPointerUp={(e) => processPointerUp(e.clientX, e.clientY, e.pointerId)}
            onPointerCancel={(e) => processPointerUp(e.clientX, e.clientY, e.pointerId)}
          >
            <AnimatePresence>
              {phase === 'preview' && (
                <motion.div
                  key="preview"
                  className="game__preview-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="game__preview-word">{currentWord}</span>
                  <div className="game__preview-timer">
                    <div
                      className="game__preview-timer-fill"
                      style={{ width: `${(previewCountdown / settings.previewSeconds) * 100}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === 'playing' && wordHintActive && (
              <motion.div
                key="word-hint"
                className="game__hint-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <span className="game__preview-word">{currentWord}</span>
                <div className="game__preview-timer">
                  <div
                    className="game__preview-timer-fill"
                    style={{ width: `${(wordHintCountdown / WORD_HINT_SECONDS) * 100}%` }}
                  />
                </div>
              </motion.div>
            )}

        {phase === 'playing' && fallingLetters.map((letter) => (
          <motion.div
            key={letter.id}
            data-letter-id={letter.id}
            className="game__falling-letter"
            style={{
              left: letter.x,
              top: letter.y,
              rotate: letter.rotation,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            {letter.char}
          </motion.div>
        ))}

        {destroyingLetters.map((d) =>
          d.type === 'slice' ? (
            <div
              key={`slice-${d.id}`}
              className="game__letter-destroy game__letter-destroy--slice"
              style={{
                left: d.x,
                top: d.y,
                transform: `rotate(${d.rotation}deg)`,
                ['--slash-angle' as string]: `${d.slashAngle}rad`,
              }}
            >
              <motion.span
                className="game__letter-half game__letter-half--left"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(d.slashAngle + Math.PI / 2) * -38,
                  y: Math.sin(d.slashAngle + Math.PI / 2) * -38,
                  rotate: -28,
                  opacity: 0,
                }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
              >
                {d.char}
              </motion.span>
              <motion.span
                className="game__letter-half game__letter-half--right"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(d.slashAngle + Math.PI / 2) * 38,
                  y: Math.sin(d.slashAngle + Math.PI / 2) * 38,
                  rotate: 28,
                  opacity: 0,
                }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
              >
                {d.char}
              </motion.span>
              <motion.span
                className="game__slice-flash"
                initial={{ opacity: 0.9, scaleX: 0 }}
                animate={{ opacity: 0, scaleX: 1.2 }}
                transition={{ duration: 0.25 }}
              />
            </div>
          ) : (
            <div
              key={`explode-${d.id}`}
              className="game__letter-destroy game__letter-destroy--explode"
              style={{ left: d.x, top: d.y, transform: `rotate(${d.rotation}deg)` }}
            >
              <motion.span
                className="game__explode-core"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {d.char}
              </motion.span>
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = (i / 10) * Math.PI * 2
                return (
                  <motion.span
                    key={i}
                    className="game__explode-shard"
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * (44 + (i % 3) * 8),
                      y: Math.sin(angle) * (44 + (i % 3) * 8),
                      scale: 0,
                      opacity: 0,
                      rotate: (i % 2 === 0 ? 1 : -1) * (60 + i * 20),
                    }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                  >
                    {d.char}
                  </motion.span>
                )
              })}
            </div>
          ),
        )}

        {celebrate && (
          <div className="game__confetti">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.span
                key={i}
                className="game__confetti-piece"
                initial={{
                  x: Math.random() * 300 - 150,
                  y: 0,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  y: 400,
                  opacity: 0,
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{ duration: 1.2, delay: Math.random() * 0.3 }}
                style={{
                  left: `${Math.random() * 100}%`,
                  background: ['#7C3AED', '#A78BFA', '#FFFFFF', '#5B21B6'][i % 4],
                }}
              />
            ))}
          </div>
        )}
          </div>

          <div className="game__overlay">
            <AnimatePresence>
              {phase === 'word-complete' && wordScorePopup && (
                <motion.div
                  key={`complete-${wordScorePopup.id}`}
                  className="game__word-done"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
              <span className="game__word-done-bonus">+{wordScorePopup.points}</span>
              <span className="game__word-done-label">{lastSpeedLabel}</span>
              {bonusPopup && <span className="game__bonus-flash">{bonusPopup}</span>}
                </motion.div>
              )}
              {phase === 'all-complete' && (
                <FinalTally
                  score={score}
                  stats={sessionStats}
                  sessionBadges={sessionBadges}
                  sessionUpgrades={sessionUpgrades}
                  goals={goals}
                  wordCount={words.length}
                  onPlayAgain={onBack}
                  highScore={Math.max(playerProgress.highScore, score)}
                  isNewHighScore={score > playerProgress.highScore}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="game__slots-section">
        {phase === 'playing' && slotsMessage && (
          <div className={`game__slots-message game__slots-message--${slotsMessage.tone}`}>
            {slotsMessage.text}
          </div>
        )}
        <div className="game__slots-bar">
          <div className="game__slots">
            {currentWord.split('').map((_, i) => (
              <div
                key={i}
                ref={(el) => { slotRefs.current[i] = el }}
                className={`game__slot ${i < placedLetters.length ? 'game__slot--filled' : ''} ${i === letterIndex && phase === 'playing' ? 'game__slot--active' : ''} ${landingSlot === i ? 'game__slot--landing' : ''}`}
              >
                {placedLetters[i] ? (
                  <motion.span
                    className="game__slot-letter"
                    initial={{ scale: 0.3, y: 8, rotate: -8 }}
                    animate={{ scale: [0.3, 1.25, 1], y: [8, -6, 0], rotate: [-8, 4, 0] }}
                    transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {placedLetters[i]}
                  </motion.span>
                ) : (
                  <span className="game__slot-underscore" />
                )}
                {landingSlot === i && <span className="game__slot-ripple" />}
              </div>
            ))}
          </div>
          {phase === 'playing' && (
            <button
              type="button"
              className="game__hint-btn"
              onClick={handleShowWordAgain}
              disabled={wordHintActive || flyingLetter !== null}
            >
              Show word again
              <span className="game__hint-cost">−{WORD_HINT_PENALTY}</span>
            </button>
          )}
        </div>
      </div>

      <BadgeToast badgeId={badgeToast} />

      <div className="game__fx-layer" aria-hidden="true">
        {swipeTrails.map((trail) => (
          <svg
            key={trail.id}
            className={`game__swipe-trail ${trail.fading ? 'game__swipe-trail--fading' : ''}`}
          >
            <defs>
              <linearGradient id={`trail-grad-${trail.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(167, 139, 250, 0)" />
                <stop offset="35%" stopColor="rgba(167, 139, 250, 0.85)" />
                <stop offset="65%" stopColor="rgba(255, 255, 255, 0.95)" />
                <stop offset="100%" stopColor="rgba(124, 58, 237, 0.2)" />
              </linearGradient>
              <filter id={`trail-glow-${trail.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              className="game__swipe-trail-outer"
              d={buildTrailPath(trail.points)}
              stroke={`url(#trail-grad-${trail.id})`}
              filter={`url(#trail-glow-${trail.id})`}
            />
            <path
              className="game__swipe-trail-core"
              d={buildTrailPath(trail.points)}
            />
          </svg>
        ))}

        <AnimatePresence>
          {captureRing && (
            <motion.span
              key={`ring-${captureRing.id}`}
              className="game__capture-ring"
              style={{ left: captureRing.x, top: captureRing.y }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {captureParticles.map((p) => (
          <motion.span
            key={p.id}
            className="game__capture-particle"
            style={{ left: p.x, top: p.y }}
            initial={{ scale: 1.2, opacity: 1, x: 0, y: 0 }}
            animate={{
              x: Math.cos(p.angle) * (36 + Math.random() * 20),
              y: Math.sin(p.angle) * (36 + Math.random() * 20),
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          />
        ))}

        <AnimatePresence>
          {flyingLetter && (
            <motion.div
              key={`fly-${flyingLetter.id}`}
              className="game__flying-letter"
              style={{ left: 0, top: 0 }}
              initial={{
                x: flyingLetter.fromX,
                y: flyingLetter.fromY,
                scale: 1,
                rotate: 0,
              }}
              animate={{
                x: [
                  flyingLetter.fromX,
                  (flyingLetter.fromX + flyingLetter.toX) / 2,
                  flyingLetter.toX,
                ],
                y: [
                  flyingLetter.fromY,
                  Math.min(flyingLetter.fromY, flyingLetter.toY) - 110,
                  flyingLetter.toY,
                ],
                scale: [1, 1.5, 1],
                rotate: [0, -20, 0],
              }}
              transition={{
                duration: 0.72,
                times: [0, 0.38, 1],
                ease: ['easeOut', 'easeInOut'],
              }}
              onAnimationComplete={handleFlyingComplete}
            >
              <span className="game__flying-letter-char">{flyingLetter.char}</span>
              <span className="game__flying-letter-trail" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
