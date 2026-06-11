import { useState } from 'react'
import TeacherSetup from './components/TeacherSetup'
import GameScreen from './components/GameScreen'
import MathGameScreen from './components/MathGameScreen'
import type { GameSettings } from './types'
import './App.css'

type Screen = 'setup' | 'spell-game' | 'math-game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [words, setWords] = useState<string[]>([])
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'spell',
    previewSeconds: 2,
    dropSpeed: 'normal',
  })

  function handleStart(wordList: string[], gameSettings: GameSettings) {
    setSettings(gameSettings)
    if (gameSettings.mode === 'math') {
      setScreen('math-game')
    } else {
      setWords(wordList)
      setScreen('spell-game')
    }
  }

  function handleBack() {
    setScreen('setup')
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        {screen === 'setup' && (
          <TeacherSetup onStart={handleStart} initialSettings={settings} />
        )}
        {screen === 'spell-game' && settings.mode === 'spell' && (
          <GameScreen words={words} settings={settings} onBack={handleBack} />
        )}
        {screen === 'math-game' && settings.mode === 'math' && (
          <MathGameScreen settings={settings} onBack={handleBack} />
        )}
      </div>
    </div>
  )
}
