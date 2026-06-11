import { motion } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'
import { getBadge, getUpgrade, type Goal, type SessionStats } from '../progression'
import { isGoalComplete } from '../progression'
import './FinalTally.css'

interface Props {
  score: number
  stats: SessionStats
  sessionBadges: string[]
  sessionUpgrades: string[]
  goals: Goal[]
  wordCount: number
  onPlayAgain: () => void
}

export default function FinalTally({
  score,
  stats,
  sessionBadges,
  sessionUpgrades,
  goals,
  wordCount,
  onPlayAgain,
}: Props) {
  const displayScore = useCountUp(score, true, 2200)
  const goalsDone = goals.filter((g) => isGoalComplete(g.id, stats, wordCount, score)).length

  return (
    <motion.div
      className="tally"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="tally__title">AMAZING!</span>

      <div className="tally__score-block">
        <span className="tally__score-label">Final Score</span>
        <span className="tally__score">{displayScore.toLocaleString()}</span>
        <span className="tally__score-pts">points</span>
      </div>

      {(stats.streakBonusTotal > 0 || stats.ninjaBonusTotal > 0 || stats.speedBonusTotal > 0) && (
        <div className="tally__bonuses">
          {stats.streakBonusTotal > 0 && (
            <span className="tally__bonus">🔥 Streak +{stats.streakBonusTotal}</span>
          )}
          {stats.ninjaBonusTotal > 0 && (
            <span className="tally__bonus">🥷 Ninja +{stats.ninjaBonusTotal}</span>
          )}
          {stats.speedBonusTotal > 0 && (
            <span className="tally__bonus">💨 Speed +{stats.speedBonusTotal}</span>
          )}
        </div>
      )}

      <div className="tally__section">
        <span className="tally__section-title">Goals — {goalsDone}/{goals.length}</span>
        <div className="tally__goals">
          {goals.map((goal, i) => {
            const done = isGoalComplete(goal.id, stats, wordCount, score)
            return (
              <motion.span
                key={goal.id}
                className={`tally__goal ${done ? 'tally__goal--done' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                {goal.emoji} {done ? '✓' : '○'} {goal.label}
              </motion.span>
            )
          })}
        </div>
      </div>

      {sessionBadges.length > 0 && (
        <div className="tally__section">
          <span className="tally__section-title">Badges Earned</span>
          <div className="tally__badges">
            {sessionBadges.map((id, i) => {
              const badge = getBadge(id)
              if (!badge) return null
              return (
                <motion.div
                  key={id}
                  className="tally__badge"
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2 + i * 0.15, type: 'spring', stiffness: 260, damping: 16 }}
                >
                  <span className="tally__badge-emoji">{badge.emoji}</span>
                  <span className="tally__badge-name">{badge.name}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {sessionUpgrades.length > 0 && (
        <div className="tally__section">
          <span className="tally__section-title">Upgrades Unlocked</span>
          <div className="tally__upgrades">
            {sessionUpgrades.map((id, i) => {
              const upgrade = getUpgrade(id)
              if (!upgrade) return null
              return (
                <motion.div
                  key={id}
                  className="tally__upgrade"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 + i * 0.12 }}
                >
                  <span>{upgrade.emoji}</span>
                  <div>
                    <strong>{upgrade.name}</strong>
                    <small>{upgrade.description}</small>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <div className="tally__stats-row">
        <span>Best streak: {stats.bestLetterStreak}</span>
        <span>Ninja: {stats.ninjaCaptures}</span>
        <span>Perfect: {stats.perfectWords}</span>
      </div>

      <motion.button
        className="tally__play-again"
        onClick={onPlayAgain}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        Play Again
      </motion.button>
    </motion.div>
  )
}
