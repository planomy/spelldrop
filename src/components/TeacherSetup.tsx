import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseWordList } from '../utils'
import { loadProgress, BADGES, UPGRADES } from '../progression'
import { DROP_SPEED_OPTIONS } from '../dropSpeed'
import { MODE_ICONS, SETUP_ICONS } from '../icons'
import type { DropSpeed, GameMode, GameSettings, MathDuration, SpellSettings, MathSettings } from '../types'
import GameIcon from './GameIcon'
import GameLogo from './GameLogo'
import SetupBadgeShelf from './SetupBadgeShelf'
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
    setWordInput(SAMPLE_LISTS[key])
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

  const showProgress = progress.unlockedBadges.length > 0 || progress.totalGamesPlayed > 0

  return (
    <div className="setup">
      <motion.div
        className="setup__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="setup__title">
          <GameLogo size="hero" />
        </h1>
        <div className="setup__header-controls">
          <div className="setup__mode-tabs" role="tablist" aria-label="Game mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'spell'}
              className={`setup__mode-tab ${mode === 'spell' ? 'setup__mode-tab--active' : ''}`}
              onClick={() => setMode('spell')}
            >
              <GameIcon src={MODE_ICONS.spell} alt="" size="sm" className="setup__mode-icon" />
              <span className="setup__mode-copy">
                <span className="setup__mode-name">Spelling</span>
                <span className="setup__mode-desc">Catch letters, build words</span>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'math'}
              className={`setup__mode-tab ${mode === 'math' ? 'setup__mode-tab--active' : ''}`}
              onClick={() => setMode('math')}
            >
              <GameIcon src={MODE_ICONS.math} alt="" size="sm" className="setup__mode-icon" />
              <span className="setup__mode-copy">
                <span className="setup__mode-name">Times Tables</span>
                <span className="setup__mode-desc">Swipe the right answer</span>
              </span>
            </button>
          </div>

          <div
            className="setup__controls-speed"
            title="Faster drops = more chances to score"
          >
            <span className="setup__controls-speed-label">Drop speed</span>
            <div className="setup__speed-row">
              {DROP_SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`setup__speed-btn ${dropSpeed === opt.id ? 'setup__speed-btn--active' : ''}`}
                  onClick={() => setDropSpeed(opt.id)}
                  aria-pressed={dropSpeed === opt.id}
                >
                  <GameIcon src={opt.icon} alt="" size="sm" className="setup__speed-icon" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="setup__badge-bar">
        <SetupBadgeShelf unlockedBadgeIds={progress.unlockedBadges} />
        {showProgress && (
          <div className="setup__trophy">
            <span className="setup__trophy-item">
              <GameIcon src={SETUP_ICONS.badges} alt="Badges" size="sm" />
              {progress.unlockedBadges.length}/{BADGES.length} badges
            </span>
            <span className="setup__trophy-item">
              <GameIcon src={SETUP_ICONS.upgrades} alt="Upgrades" size="sm" />
              {progress.unlockedUpgrades.length}/{UPGRADES.length} upgrades
            </span>
            {progress.highScore > 0 && (
              <span className="setup__trophy-item">
                <GameIcon src={SETUP_ICONS.best} alt="Best score" size="sm" />
                Best {progress.highScore.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      <motion.div
        className="setup__panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        <AnimatePresence mode="wait">
          {mode === 'spell' ? (
            <motion.div
              key="spell"
              className="setup__mode-body setup__workspace"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="setup__section">
                <label className="setup__label" htmlFor="words">
                  Word List
                  <span className="setup__hint">Comma-separated words</span>
                </label>
                <input
                  id="words"
                  type="text"
                  className="setup__word-input"
                  placeholder="e.g. cat, dog, sun, hat"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
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
              className="setup__mode-body setup__workspace"
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
          START!
        </motion.button>
      </motion.div>
    </div>
  )
}
