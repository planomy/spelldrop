import { motion, AnimatePresence } from 'framer-motion'
import { getBadge } from '../progression'
import './BadgeToast.css'

interface Props {
  badgeId: string | null
}

export default function BadgeToast({ badgeId }: Props) {
  const badge = badgeId ? getBadge(badgeId) : null

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          className="badge-toast"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <span className="badge-toast__tag">Badge Unlocked!</span>
          <span className="badge-toast__emoji">{badge.emoji}</span>
          <div className="badge-toast__info">
            <span className="badge-toast__name">{badge.name}</span>
            <span className="badge-toast__desc">{badge.description}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
