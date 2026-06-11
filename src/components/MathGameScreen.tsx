import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameLogo from './GameLogo'
import StreakBanner from './StreakBanner'
import GoalsBar from './GoalsBar'
import BadgeToast from './BadgeToast'
import FinalTally from './FinalTally'
import type {
  MathSettings,
  FallingLetter,
  FlyingLetterAnim,
  CaptureParticle,
  SwipeTrail,
  LetterDestroyAnim,
} from '../types'
import { getSpawnIntervalMs } from '../dropSpeed'
import {
  createSessionStats,
  loadProgress,
  recordGameEnd,
  saveProgress,
  buildMathGoals,
  checkBadges,
  unlockUpgradesForBadges,
  recordCorrectCapture,
  recordWrongHit,
  recordWordComplete,
  type SessionStats,
  type PlayerProgress,
  type Goal,
} from '../progression'
import { playSound, MAX_FALLING_LETTERS } from '../utils'
import {
  createMathProblem,
  createMathBurst,
  createSpawnedMathNumber,
  formatProblem,
  type MathProblem,
} from '../mathUtils'
import { SWIPE_THRESHOLD, TRAIL_MIN_DIST, buildTrailPath, toStageCoords } from '../swipeTrail'
import './GameScreen.css'
import './MathGameScreen.css'

const WRONG_ANSWER_PENALTY = 10
const RANDOM_SWIPE_PENALTY = 15

type MathPhase = 'countdown' | 'playing' | 'problem-done' | 'complete'

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
  settings: MathSettings
  onBack: () => void
}

export default function MathGameScreen({ settings, onBack }: Props) {
  const [phase, setPhase] = useState<MathPhase>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [timeLeft, setTimeLeft] = useState<number>(settings.durationSeconds)
  const timeLeftRef = useRef<number>(settings.durationSeconds)
  const [problem, setProblem] = useState<MathProblem>(() => createMathProblem(settings.tables))
  const [fallingLetters, setFallingLetters] = useState<FallingLetter[]>([])
  const [wrongFlash, setWrongFlash] = useState(false)
  const [flyingLetter, setFlyingLetter] = useState<FlyingLetterAnim | null>(null)
  const [captureParticles, setCaptureParticles] = useState<CaptureParticle[]>([])
  const [captureRing, setCaptureRing] = useState<{ x: number; y: number; id: number } | null>(null)
  const [successPulse, setSuccessPulse] = useState(false)
  const [score, setScore] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [swipeTrails, setSwipeTrails] = useState<SwipeTrail[]>([])
  const [destroyingLetters, setDestroyingLetters] = useState<LetterDestroyAnim[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats>(createSessionStats)
  const [playerProgress] = useState<PlayerProgress>(loadProgress)
  const [sessionBadges, setSessionBadges] = useState<string[]>([])
  const [sessionUpgrades, setSessionUpgrades] = useState<string[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [badgeToast, setBadgeToast] = useState<string | null>(null)
  const [slotsMessage, setSlotsMessage] = useState<SlotsMessage | null>(null)
  const [problemsSolved, setProblemsSolved] = useState(0)

  const gameStageRef = useRef<HTMLDivElement>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const problemStartRef = useRef(0)
  const flyingIdRef = useRef(0)
  const trailIdRef = useRef(0)
  const savedRef = useRef(false)
  const sessionStatsRef = useRef(sessionStats)
  const progressRef = useRef({ playerProgress, sessionBadges, sessionUpgrades })
  const fallingLettersRef = useRef(fallingLetters)
  const gameStateRef = useRef({
    fallingLetters,
    phase,
    flyingLetter,
    problem,
  })
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

  const activeUpgrades = playerProgress.unlockedUpgrades
  const processMoveRef = useRef<(clientX: number, clientY: number, pointerId: number) => void>(() => {})
  const processUpRef = useRef<(clientX: number, clientY: number, pointerId: number) => void>(() => {})
  const lastTapRef = useRef(0)

  useEffect(() => {
    sessionStatsRef.current = sessionStats
  }, [sessionStats])

  useEffect(() => {
    progressRef.current = { playerProgress, sessionBadges, sessionUpgrades }
  }, [playerProgress, sessionBadges, sessionUpgrades])

  useEffect(() => {
    setGoals(buildMathGoals())
  }, [])

  useEffect(() => {
    fallingLettersRef.current = fallingLetters
    gameStateRef.current.fallingLetters = fallingLetters
  }, [fallingLetters])

  useEffect(() => {
    gameStateRef.current.phase = phase
    gameStateRef.current.flyingLetter = flyingLetter
    gameStateRef.current.problem = problem
  }, [phase, flyingLetter, problem])

  const showSlotsMessage = useCallback((text: string, tone: SlotsMessage['tone']) => {
    setSlotsMessage({ text, tone })
    window.setTimeout(() => setSlotsMessage(null), 1400)
  }, [])

  const showBadgeToast = useCallback((id: string) => {
    setBadgeToast(id)
    window.setTimeout(() => setBadgeToast(null), 2800)
  }, [])

  function processNewBadges(stats: SessionStats, currentScore: number) {
    const { playerProgress: pp, sessionBadges: sb } = progressRef.current
    const allBadges = [...new Set([...pp.unlockedBadges, ...sb])]
    const newBadges = checkBadges(stats, currentScore, allBadges)
    if (newBadges.length === 0) return

    const updatedBadges = [...new Set([...sb, ...newBadges])]
    setSessionBadges(updatedBadges)
    const newUpgrades = unlockUpgradesForBadges(updatedBadges, pp.unlockedUpgrades)
    const updatedUpgrades = [...new Set([...progressRef.current.sessionUpgrades, ...newUpgrades])]
    setSessionUpgrades(updatedUpgrades)
    progressRef.current = {
      playerProgress: pp,
      sessionBadges: updatedBadges,
      sessionUpgrades: updatedUpgrades,
    }
    showBadgeToast(newBadges[newBadges.length - 1])
  }

  function penalizeWrongAnswer() {
    playSound('wrong')
    setWrongFlash(true)
    window.setTimeout(() => setWrongFlash(false), 350)
    const stats = recordWrongHit(sessionStatsRef.current)
    sessionStatsRef.current = stats
    setSessionStats(stats)
    setScore((s) => Math.max(0, s - WRONG_ANSWER_PENALTY))
    showSlotsMessage(`−${WRONG_ANSWER_PENALTY} wrong answer`, 'penalty')
  }

  function penalizeRandomSwipe() {
    playSound('wrong')
    setWrongFlash(true)
    window.setTimeout(() => setWrongFlash(false), 350)
    const stats = recordWrongHit(sessionStatsRef.current)
    sessionStatsRef.current = stats
    setSessionStats(stats)
    setScore((s) => Math.max(0, s - RANDOM_SWIPE_PENALTY))
    showSlotsMessage(`−${RANDOM_SWIPE_PENALTY} wild swipe`, 'penalty')
  }

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
    if (phase !== 'complete' || savedRef.current) return
    savedRef.current = true
    const { playerProgress: pp, sessionBadges: sb, sessionUpgrades: su } = progressRef.current
    saveProgress(recordGameEnd(pp, sb, su, score))
  }, [phase, score])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      const width = gameAreaRef.current?.clientWidth ?? 600
      const burst = createMathBurst(problem, settings.tables, width, settings.dropSpeed)
      problemStartRef.current = Date.now()
      fallingLettersRef.current = burst
      gameStateRef.current = { ...gameStateRef.current, phase: 'playing', fallingLetters: burst }
      setFallingLetters(burst)
      setPhase('playing')
      playSound('pop')
      return
    }
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [phase, countdown, problem, settings.tables, settings.dropSpeed])

  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1
        timeLeftRef.current = Math.max(0, next)
        if (next <= 0) {
          window.clearInterval(timer)
          setPhase('complete')
          return 0
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])

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

  useEffect(() => {
    if (phase !== 'playing') return
    const baseInterval = 580
    const interval = window.setInterval(() => {
      const width = gameAreaRef.current?.clientWidth ?? 600
      const currentProblem = gameStateRef.current.problem
      setFallingLetters((prev) => {
        if (prev.length >= MAX_FALLING_LETTERS) return prev
        const next = [
          ...prev,
          createSpawnedMathNumber(currentProblem, settings.tables, width, settings.dropSpeed),
        ]
        fallingLettersRef.current = next
        gameStateRef.current.fallingLetters = next
        return next
      })
    }, getSpawnIntervalMs(settings.dropSpeed, baseInterval))
    return () => window.clearInterval(interval)
  }, [phase, settings.tables, settings.dropSpeed])

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
    window.setTimeout(() => {
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

  function startFlyingAnswer(char: string, fromX: number, fromY: number) {
    const stageRect = gameStageRef.current?.getBoundingClientRect()
    const problemEl = problemRef.current
    if (!stageRect || !problemEl) {
      completeProblem(char)
      return
    }
    const rect = problemEl.getBoundingClientRect()
    const toX = rect.left - stageRect.left + rect.width / 2
    const toY = rect.top - stageRect.top + rect.height / 2
    flyingIdRef.current += 1
    const flying = {
      char,
      fromX,
      fromY,
      toX,
      toY,
      slotIndex: 0,
      id: flyingIdRef.current,
    }
    gameStateRef.current.flyingLetter = flying
    setFlyingLetter(flying)
  }

  function completeProblem(_char: string) {
    const elapsed = Date.now() - problemStartRef.current
    const basePoints = elapsed < 3000 ? 80 : elapsed < 6000 ? 55 : 40
    const result = recordWordComplete(sessionStatsRef.current, 1, elapsed, basePoints, activeUpgrades)
    sessionStatsRef.current = result.stats
    setSessionStats(result.stats)
    setProblemsSolved((p) => p + 1)

    setScore((s) => {
      const newScore = s + result.totalWordPoints
      processNewBadges(result.stats, newScore)
      return newScore
    })
    setLastPoints(result.totalWordPoints)
    gameStateRef.current.flyingLetter = null
    setFlyingLetter(null)
    setSuccessPulse(true)
    playSound('complete')

    const nextProblem = createMathProblem(settings.tables)
    setProblem(nextProblem)
    gameStateRef.current.problem = nextProblem
    problemStartRef.current = Date.now()
    setFallingLetters([])
    setPhase('problem-done')

    window.setTimeout(() => {
      setSuccessPulse(false)
      if (timeLeftRef.current <= 0) {
        setPhase('complete')
        return
      }
      const width = gameAreaRef.current?.clientWidth ?? 600
      const burst = createMathBurst(nextProblem, settings.tables, width, settings.dropSpeed)
      fallingLettersRef.current = burst
      gameStateRef.current = { ...gameStateRef.current, phase: 'playing', fallingLetters: burst }
      setFallingLetters(burst)
      setPhase('playing')
    }, 700)
  }

  function findNumberAt(
    clientX: number,
    clientY: number,
  ): { letter: FallingLetter; fromX: number; fromY: number } | null {
    const area = gameAreaRef.current
    const stageRect = gameStageRef.current?.getBoundingClientRect()
    if (!area || !stageRect) return null

    const pad = 14
    const expected = String(gameStateRef.current.problem.answer)
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
      const hit = { letter, fromX: cx - stageRect.left, fromY: cy - stageRect.top }
      if (letter.char === expected) return hit
      if (!fallback) fallback = hit
    }
    return fallback
  }

  function tryCaptureNumber(
    letter: FallingLetter,
    fromX: number,
    fromY: number,
    ninja = false,
    slashAngle = 0,
  ) {
    const { phase: curPhase, flyingLetter: flying, problem: curProblem } = gameStateRef.current
    if (curPhase !== 'playing' || flying) return false

    const now = Date.now()
    if (!ninja && now - lastTapRef.current < 300) return false
    if (!ninja) lastTapRef.current = now

    const expected = String(curProblem.answer)
    if (letter.char !== expected) {
      if (!ninja || !swipeRef.current.wrongTriggered) {
        if (ninja) swipeRef.current.wrongTriggered = true
        penalizeWrongAnswer()
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
    window.setTimeout(() => {
      setDestroyingLetters((prev) => prev.filter((d) => d.id !== letter.id))
    }, ninja ? 360 : 280)

    startFlyingAnswer(letter.char, fromX, fromY)
    return true
  }

  function checkSwipeSegment(x1: number, y1: number, x2: number, y2: number) {
    if (gameStateRef.current.flyingLetter) return
    const dist = Math.hypot(x2 - x1, y2 - y1)
    const steps = Math.max(1, Math.ceil(dist / 8))
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const expected = String(gameStateRef.current.problem.answer)

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const hit = findNumberAt(px, py)
      if (!hit || swipeRef.current.hitIds.has(hit.letter.id)) continue
      swipeRef.current.hitLetter = true
      if (hit.letter.char === expected) {
        if (tryCaptureNumber(hit.letter, hit.fromX, hit.fromY, true, angle)) {
          swipeRef.current.hitIds.add(hit.letter.id)
          return
        }
      } else {
        swipeRef.current.hitIds.add(hit.letter.id)
        tryCaptureNumber(hit.letter, hit.fromX, hit.fromY, true, angle)
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
      if (!swipe.hitLetter && !swipe.wrongTriggered && swipeDist > SWIPE_THRESHOLD) {
        penalizeRandomSwipe()
      }
      if (swipe.trailId !== null) fadeSwipeTrail(swipe.trailId)
    } else {
      const hit = findNumberAt(clientX, clientY)
      if (hit) tryCaptureNumber(hit.letter, hit.fromX, hit.fromY, false)
    }

    swipeRef.current = {
      ...swipe,
      active: false,
      hitIds: new Set(),
      wrongTriggered: false,
      trailId: null,
    }
  }

  processMoveRef.current = processPointerMove
  processUpRef.current = processPointerUp

  function handlePointerDown(e: React.PointerEvent) {
    if (phase !== 'playing' || flyingLetter) return

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

  function handleFlyingComplete() {
    if (flyingLetter) completeProblem(flyingLetter.char)
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
  }

  const timerPercent = (timeLeft / settings.durationSeconds) * 100

  return (
    <div ref={gameStageRef} className={`game math-game ${wrongFlash ? 'game--wrong' : ''} ${successPulse ? 'game--success' : ''}`}>
      <div className="game__hud">
        <div className="game__hud-brand">
          <button type="button" className="game__back" onClick={onBack} aria-label="Back to setup">
            ←
          </button>
          <GameLogo size="sm" className="game__hud-logo" />
        </div>
        <div className="game__hud-body">
          <div className="game__hud-row">
            <div className="game__math-timer">
              <span className="game__math-timer-label">Time</span>
              <span className="game__math-timer-value">{formatTime(timeLeft)}</span>
            </div>
            <StreakBanner streak={sessionStats.letterStreak} compact />
            {phase === 'playing' && (
              <GoalsBar
                variant="header"
                goals={goals}
                stats={sessionStats}
                wordCount={15}
                score={score}
              />
            )}
            <span className="game__hud-score">{score.toLocaleString()}</span>
          </div>
          <div className="game__math-timer-bar game__math-timer-bar--wide">
            <div className="game__math-timer-fill" style={{ width: `${timerPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="game__playfield">
        <div className="game__area-wrap">
          <div
            ref={gameAreaRef}
            className={`game__area ${wrongFlash ? 'game__area--wrong' : ''} ${successPulse ? 'game__area--success' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => processPointerUp(e.clientX, e.clientY, e.pointerId)}
            onPointerCancel={(e) => processPointerUp(e.clientX, e.clientY, e.pointerId)}
          >
            {fallingLetters.map((letter) => (
              <div
                key={letter.id}
                data-letter-id={letter.id}
                className="game__falling-letter game__falling-number"
                style={{
                  left: letter.x,
                  top: letter.y,
                  transform: `rotate(${letter.rotation}deg)`,
                }}
              >
                {letter.char}
              </div>
            ))}

            {destroyingLetters.map((d) => (
              <div
                key={`destroy-${d.id}`}
                className={`game__destroy-letter ${d.type === 'slice' ? 'game__destroy-letter--slice' : ''}`}
                style={{
                  left: d.x,
                  top: d.y,
                  transform: `rotate(${d.rotation}deg)`,
                  ['--slash-angle' as string]: `${d.slashAngle}rad`,
                }}
              >
                {d.char}
              </div>
            ))}
          </div>

          <div className="math-game__problem-dock">
            {phase === 'playing' && slotsMessage && (
              <div className={`game__slots-message game__slots-message--${slotsMessage.tone}`}>
                {slotsMessage.text}
              </div>
            )}
            <div
              ref={problemRef}
              className={`math-game__problem ${successPulse ? 'math-game__problem--pulse' : ''}`}
            >
              <span className="math-game__problem-label">Solve</span>
              <span className="math-game__problem-text">{formatProblem(problem)}</span>
              <span className="math-game__problem-solved">{problemsSolved} solved</span>
            </div>
          </div>

          <div className="game__overlay">
            <AnimatePresence>
              {phase === 'countdown' && (
                <motion.div
                  key="countdown"
                  className="game__math-countdown"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                >
                  {countdown > 0 ? countdown : 'GO!'}
                </motion.div>
              )}
              {phase === 'problem-done' && (
                <motion.div
                  key="points"
                  className="game__word-done"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="game__word-done-bonus">+{lastPoints}</span>
                </motion.div>
              )}
              {phase === 'complete' && (
                <FinalTally
                  score={score}
                  stats={sessionStats}
                  sessionBadges={sessionBadges}
                  sessionUpgrades={sessionUpgrades}
                  goals={goals}
                  wordCount={15}
                  onPlayAgain={onBack}
                  highScore={Math.max(playerProgress.highScore, score)}
                  isNewHighScore={score > playerProgress.highScore}
                />
              )}
            </AnimatePresence>
          </div>
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
            </defs>
            <path className="game__swipe-trail-outer" d={buildTrailPath(trail.points)} stroke={`url(#trail-grad-${trail.id})`} />
            <path className="game__swipe-trail-core" d={buildTrailPath(trail.points)} />
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
              className="game__flying-letter game__flying-number"
              style={{ left: 0, top: 0 }}
              initial={{ x: flyingLetter.fromX, y: flyingLetter.fromY, scale: 1, rotate: 0 }}
              animate={{
                x: [flyingLetter.fromX, (flyingLetter.fromX + flyingLetter.toX) / 2, flyingLetter.toX],
                y: [flyingLetter.fromY, Math.min(flyingLetter.fromY, flyingLetter.toY) - 110, flyingLetter.toY],
                scale: [1, 1.5, 1],
                rotate: [0, -20, 0],
              }}
              transition={{ duration: 0.72, times: [0, 0.38, 1], ease: ['easeOut', 'easeInOut'] }}
              onAnimationComplete={handleFlyingComplete}
            >
              <span className="game__flying-letter-char">{flyingLetter.char}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
