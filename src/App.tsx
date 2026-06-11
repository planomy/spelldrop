import { useState } from 'react'
import TeacherSetup from './components/TeacherSetup'
import GameScreen from './components/GameScreen'
import type { GameSettings } from './types'
import './App.css'

type Screen = 'setup' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [words, setWords] = useState<string[]>([])
  const [settings, setSettings] = useState<GameSettings>({
    previewSeconds: 2,
  })

  function handleStart(wordList: string[], gameSettings: GameSettings) {
    setWords(wordList)
    setSettings(gameSettings)
    setScreen('game')
  }

  function handleBack() {
    setScreen('setup')
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        {screen === 'setup' ? (
          <TeacherSetup onStart={handleStart} initialSettings={settings} />
        ) : (
          <GameScreen
            words={words}
            settings={settings}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
