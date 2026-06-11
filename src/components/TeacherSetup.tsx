import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseWordList } from '../utils'
import { loadProgress, BADGES, UPGRADES } from '../progression'
import { DROP_SPEED_OPTIONS } from '../dropSpeed'
import type { DropSpeed, GameMode, GameSettings, MathDuration, SpellSettings, MathSettings } from '../types'
import './TeacherSetup.css'

const SAMPLE_LISTS: Record<string, string> = {
  'Grade 1':
    'cat, dog, sun, hat, run, mum, dad, sit, cup, pen, bed, hen, pig, top, fun',
  'Grade 2':
    'fish, chip, shop, tree, play, rain, book, look, home, cake, frog, ship, blue, when, with',
  'Grade 3':
    'school, friend, happy, water, garden, flower, winter, animal, people, because, mother, father, around, before, always',
  'Grade 4':
    'beautiful, different, important, favourite, surprise, imagine, natural, history, question, remember, business, exercise, special, complete, continue',
  'Grade 5':
    'necessary, separate, environment, government, knowledge, excellent, language, courageous, medicine, favourite, different, important, natural, surprise, remember',
  'Grade 6':
    'accommodate, recommend, category, privilege, occurrence, pronunciation, significance, parliament, conscience, miscellaneous, immediately, exaggerate, rhythm, guarantee, curiosity',
}

const PREVIEW_OPTIONS = [1, 2, 3] as const
const TABLE_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const DURATION_OPTIONS: { value: MathDuration; label: string }[] = [
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
]

interface Props {
  onStart: (words: string[], settings: GameSettings) => void
  initialSettings: GameSettings
}

function defaultDropSpeed(settings: GameSettings): DropSpeed {
  return settings.dropSpeed ?? 'normal'
}

export default function TeacherSetup({ onStart, initialSettings }: Props) {
  const [mode, setMode] = useState<GameMode>(initialSettings.mode)
  const [wordInput, setWordInput] = useState('')
  const [previewSeconds, setPreviewSeconds] = useState(
    initialSettings.mode === 'spell' ? initialSettings.previewSeconds : 2,
  )
  const [dropSpeed, setDropSpeed] = useState<DropSpeed>(defaultDropSpeed(initialSettings))
  const [selectedTables, setSelectedTables] = useState<number[]>(
    initialSettings.mode === 'math' ? initialSettings.tables : [2, 5, 10],
  )
  const [durationSeconds, setDurationSeconds] = useState<MathDuration>(
    initialSettings.mode === 'math' ? initialSettings.durationSeconds : 60,
  )

  const parsedWords = parseWordList(wordInput)
  const progress = loadProgress()
  const canStartSpell = parsedWords.length > 0
  const canStartMath = selectedTables.length > 0

  function handleStart() {
    if (mode === 'spell') {
      if (!canStartSpell) return
      const settings: SpellSettings = { mode: 'spell', previewSeconds, dropSpeed }
      onStart(parsedWords, settings)
      return
    }
    if (!canStartMath) return
    const settings: MathSettings = { mode: 'math', tables: selectedTables, durationSeconds, dropSpeed }
    onStart([], settings)
  }

  function loadSample(key: string) {
    setWordInput(SAMPLE_LISTS[key].replace(/, /g, '\n'))
  }

  function toggleTable(n: number) {
    setSelectedTables((prev) =>
      prev.includes(n) ? prev.filter((t) => t !== n) : [...prev, n].sort((a, b) => a - b),
    )
  }

  function selectAllTables() {
    setSelectedTables([...TABLE_NUMBERS])
  }

  function clearTables() {
    setSelectedTables([])
  }

  const tablesLabel =
    selectedTables.length === 0
      ? 'Pick at least one table'
      : selectedTables.length === TABLE_NUMBERS.length
        ? 'All tables'
        : selectedTables.map((t) => `${t}s`).join(', ')

  return (
    <div className="setup">
      <motion.div
        className="setup__hero"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h1 className="setup__title">
          <span className="setup__title-spell">Spell</span>
          <span className="setup__title-drop">Drop</span>
        </h1>
        <p className="setup__tagline">Swipe fast. Score big. Master spelling & times tables.</p>
        {(progress.unlockedBadges.length > 0 || progress.totalGamesPlayed > 0) && (
          <div className="setup__trophy">
            <span>🏆 {progress.unlockedBadges.length}/{BADGES.length} badges</span>
            <span>⚡ {progress.unlockedUpgrades.length}/{UPGRADES.length} upgrades</span>
            {progress.highScore > 0 && (
              <span>👑 Best {progress.highScore.toLocaleString()}</span>
            )}
            {progress.lifetimeScore > 0 && (
              <span>✦ {progress.lifetimeScore.toLocaleString()} lifetime</span>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        className="setup__panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="setup__mode-tabs" role="tablist" aria-label="Game mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'spell'}
            className={`setup__mode-tab ${mode === 'spell' ? 'setup__mode-tab--active' : ''}`}
            onClick={() => setMode('spell')}
          >
            <span className="setup__mode-icon">✏️</span>
            <span className="setup__mode-name">Spelling</span>
            <span className="setup__mode-desc">Catch letters, build words</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'math'}
            className={`setup__mode-tab ${mode === 'math' ? 'setup__mode-tab--active' : ''}`}
            onClick={() => setMode('math')}
          >
            <span className="setup__mode-icon">✖️</span>
            <span className="setup__mode-name">Times Tables</span>
            <span className="setup__mode-desc">Swipe the right answer</span>
          </button>
        </div>

        <div className="setup__shared">
          <span className="setup__shared-label">Drop speed</span>
          <div className="setup__speed-row">
            {DROP_SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`setup__speed-btn ${dropSpeed === opt.id ? 'setup__speed-btn--active' : ''}`}
                onClick={() => setDropSpeed(opt.id)}
                aria-pressed={dropSpeed === opt.id}
              >
                <span className="setup__speed-emoji">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="setup__speed-hint">Faster drops = more chances to score</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'spell' ? (
            <motion.div
              key="spell"
              className="setup__mode-body"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="setup__section">
                <label className="setup__label" htmlFor="words">
                  Word List
                  <span className="setup__hint">One word per line, or comma-separated</span>
                </label>
                <textarea
                  id="words"
                  className="setup__textarea"
                  placeholder={'cat\ndog\nsun\nhappy\nschool'}
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  rows={7}
                />
                <div className="setup__word-count">
                  {parsedWords.length > 0 ? (
                    <span>{parsedWords.length} word{parsedWords.length !== 1 ? 's' : ''} ready</span>
                  ) : (
                    <span>Add some words to get started</span>
                  )}
                </div>
              </div>

              <div className="setup__samples">
                <span className="setup__samples-label">Quick load:</span>
                {Object.keys(SAMPLE_LISTS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="setup__sample-btn"
                    onClick={() => loadSample(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className="setup__preview-row">
                <span className="setup__preview-label">Preview time:</span>
                {PREVIEW_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    className={`setup__preview-btn ${previewSeconds === sec ? 'setup__preview-btn--active' : ''}`}
                    onClick={() => setPreviewSeconds(sec)}
                    aria-pressed={previewSeconds === sec}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="math"
              className="setup__mode-body"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="setup__section">
                <div className="setup__math-header">
                  <label className="setup__label">
                    Times tables
                    <span className="setup__hint">{tablesLabel}</span>
                  </label>
                  <div className="setup__table-actions">
                    <button type="button" className="setup__table-action" onClick={selectAllTables}>
                      All
                    </button>
                    <button type="button" className="setup__table-action" onClick={clearTables}>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="setup__table-grid">
                  {TABLE_NUMBERS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`setup__table-btn ${selectedTables.includes(n) ? 'setup__table-btn--active' : ''}`}
                      onClick={() => toggleTable(n)}
                      aria-pressed={selectedTables.includes(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup__preview-row">
                <span className="setup__preview-label">Game length:</span>
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`setup__preview-btn ${durationSeconds === opt.value ? 'setup__preview-btn--active' : ''}`}
                    onClick={() => setDurationSeconds(opt.value)}
                    aria-pressed={durationSeconds === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="setup__math-example">
                Example: <strong>5 × 4</strong> appears below — swipe <strong>20</strong> as it falls
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="setup__go-btn"
          onClick={handleStart}
          disabled={mode === 'spell' ? !canStartSpell : !canStartMath}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {mode === 'spell' ? 'GO!' : 'START!'}
        </motion.button>
      </motion.div>
    </div>
  )
}
