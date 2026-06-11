import { motion, AnimatePresence } from 'framer-motion'
import './StreakBanner.css'

interface Props {
  streak: number
  compact?: boolean
}

export default function StreakBanner({ streak, compact }: Props) {
  if (streak < 2) return null

  const tier = streak >= 10 ? 'legendary' : streak >= 5 ? 'hot' : 'warm'
  const emoji = tier === 'legendary' ? '👑' : tier === 'hot' ? '🔥' : '✨'

  if (compact) {
    return (
      <span className={`streak streak--compact streak--${tier}`}>
        {emoji}{streak}
      </span>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        className={`streak streak--${tier}`}
        initial={{ scale: 0.6, opacity: 0, y: -8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <span className="streak__emoji">{emoji}</span>
        <span className="streak__count">{streak}</span>
        <span className="streak__label">streak</span>
      </motion.div>
    </AnimatePresence>
  )
}
