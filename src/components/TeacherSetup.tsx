import { useState } from 'react'
import { motion } from 'framer-motion'
import { parseWordList } from '../utils'
import { loadProgress, BADGES, UPGRADES } from '../progression'
import type { GameSettings } from '../types'
import './TeacherSetup.css'

const SAMPLE_LISTS: Record<string, string> = {
  'Grade 1': 'cat, dog, sun, hat, run, big, red, sit, top, fun',
  'Grade 2': 'happy, school, friend, water, flower, garden, purple, winter',
  'Grade 3': 'beautiful, elephant, adventure, wonderful, celebrate, important',
  'Challenge': 'rhythm, knowledge, February, necessary, accommodate, Mississippi',
}

interface Props {
  onStart: (words: string[], settings: GameSettings) => void
  initialSettings: GameSettings
}

export default function TeacherSetup({ onStart, initialSettings }: Props) {
  const [wordInput, setWordInput] = useState('')
  const [previewSeconds, setPreviewSeconds] = useState(initialSettings.previewSeconds)
  const [displayMode, setDisplayMode] = useState(initialSettings.displayMode)

  const parsedWords = parseWordList(wordInput)
  const progress = loadProgress()

  function handleStart() {
    if (parsedWords.length === 0) return
    onStart(parsedWords, { previewSeconds, displayMode })
  }

  function loadSample(key: string) {
    setWordInput(SAMPLE_LISTS[key].replace(/, /g, '\n'))
  }

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
        <p className="setup__tagline">Catch the letters. Spell the words. Have a blast!</p>
        {(progress.unlockedBadges.length > 0 || progress.totalGamesPlayed > 0) && (
          <div className="setup__trophy">
            <span>🏆 {progress.unlockedBadges.length}/{BADGES.length} badges</span>
            <span>⚡ {progress.unlockedUpgrades.length}/{UPGRADES.length} upgrades</span>
            {progress.lifetimeScore > 0 && (
              <span>✦ {progress.lifetimeScore.toLocaleString()} lifetime pts</span>
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
        <div className="setup__section">
          <label className="setup__label" htmlFor="words">
            Word List
            <span className="setup__hint">One word per line, or comma-separated</span>
          </label>
          <textarea
            id="words"
            className="setup__textarea"
            placeholder={"cat\ndog\nsun\nhappy\nschool"}
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            rows={8}
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
              className="setup__sample-btn"
              onClick={() => loadSample(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="setup__controls">
          <div className="setup__control">
            <label className="setup__label" htmlFor="preview">
              Word preview time
              <span className="setup__hint">{previewSeconds}s — how long kids see the word</span>
            </label>
            <div className="setup__slider-row">
              <span className="setup__slider-mark">1s</span>
              <input
                id="preview"
                type="range"
                min={1}
                max={3}
                step={0.5}
                value={previewSeconds}
                onChange={(e) => setPreviewSeconds(parseFloat(e.target.value))}
                className="setup__slider"
              />
              <span className="setup__slider-mark">3s</span>
            </div>
          </div>

          <div className="setup__control">
            <label className="setup__toggle">
              <input
                type="checkbox"
                checked={displayMode}
                onChange={(e) => setDisplayMode(e.target.checked)}
              />
              <span className="setup__toggle-track">
                <span className="setup__toggle-thumb" />
              </span>
              <span className="setup__toggle-label">
                Display mode
                <span className="setup__hint">Larger text for classroom projection</span>
              </span>
            </label>
          </div>
        </div>

        <motion.button
          className="setup__go-btn"
          onClick={handleStart}
          disabled={parsedWords.length === 0}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          GO!
        </motion.button>
      </motion.div>
    </div>
  )
}
