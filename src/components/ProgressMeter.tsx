import { motion } from 'framer-motion'
import './ProgressMeter.css'

interface Props {
  percent: number
  correctLetters: number
  totalLetters: number
  compact?: boolean
}

export default function ProgressMeter({ percent, correctLetters, totalLetters, compact }: Props) {
  if (compact) {
    return (
      <div className="meter meter--compact" title={`${correctLetters}/${totalLetters} letters · ${Math.round(percent)}%`}>
        <div className="meter__track">
          <motion.div
            className="meter__fill"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="meter">
      <div className="meter__header">
        <span className="meter__label">Progress</span>
        <span className="meter__count">{correctLetters} / {totalLetters}</span>
      </div>
      <div className="meter__track">
        <motion.div
          className="meter__fill"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        {percent >= 100 && (
          <motion.div
            className="meter__sparkle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            ✨
          </motion.div>
        )}
      </div>
      <span className="meter__percent">{Math.round(percent)}%</span>
    </div>
  )
}
