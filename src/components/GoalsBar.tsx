import type { Goal, SessionStats } from '../progression'
import { isGoalComplete } from '../progression'
import './GoalsBar.css'

interface Props {
  goals: Goal[]
  stats: SessionStats
  wordCount: number
  score: number
  compact?: boolean
  variant?: 'default' | 'header'
}

export default function GoalsBar({ goals, stats, wordCount, score, compact, variant = 'default' }: Props) {
  const isHeader = variant === 'header' || compact
  const completed = goals.filter((g) => isGoalComplete(g.id, stats, wordCount, score)).length

  return (
    <div className={`goals ${isHeader ? 'goals--header' : ''}`}>
      {!isHeader && (
        <div className="goals__header">
          <span className="goals__title">Goals</span>
          <span className="goals__count">{completed}/{goals.length}</span>
        </div>
      )}
      <div className="goals__list" title={isHeader ? `Goals ${completed}/${goals.length}` : undefined}>
        {goals.map((goal) => {
          const done = isGoalComplete(goal.id, stats, wordCount, score)
          return (
            <div key={goal.id} className={`goals__item ${done ? 'goals__item--done' : ''}`} title={goal.label}>
              <span className="goals__emoji">{goal.emoji}</span>
              {!isHeader && <span className="goals__label">{goal.label}</span>}
              {done && <span className="goals__check">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
