import { useState } from 'react'
import { motion } from 'framer-motion'
import { parseWordList } from '../utils'
import { loadProgress, BADGES, UPGRADES } from '../progression'
import type { GameSettings } from '../types'
import './TeacherSetup.css'

/** Quick-load lists aligned to Australian Curriculum English v9 spelling patterns by year level. */
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

interface Props {
  onStart: (words: string[], settings: GameSettings) => void
  initialSettings: GameSettings
}

export default function TeacherSetup({ onStart, initialSettings }: Props) {
  const [wordInput, setWordInput] = useState('')
  const [previewSeconds, setPreviewSeconds] = useState(initialSettings.previewSeconds)

  const parsedWords = parseWordList(wordInput)
  const progress = loadProgress()

  function handleStart() {
    if (parsedWords.length === 0) return
    onStart(parsedWords, { previewSeconds })
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
              type="button"
              className="setup__sample-btn"
              onClick={() => loadSample(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="setup__preview-row">
          <span className="setup__preview-label">Select preview time:</span>
          {PREVIEW_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              className={`setup__preview-btn ${previewSeconds === sec ? 'setup__preview-btn--active' : ''}`}
              onClick={() => setPreviewSeconds(sec)}
              aria-pressed={previewSeconds === sec}
            >
              {sec}sec
            </button>
          ))}
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
