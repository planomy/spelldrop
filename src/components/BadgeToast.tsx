import { motion, AnimatePresence } from 'framer-motion'
import { getBadge } from '../progression'
import { badgeIcon } from '../icons'
import GameIcon from './GameIcon'
import './BadgeToast.css'

interface Props {
  badgeId: string | null
}

export default function BadgeToast({ badgeId }: Props) {
  const badge = badgeId ? getBadge(badgeId) : null
  const icon = badge ? badgeIcon(badge.id) : undefined

  return (
    <AnimatePresence>
      {badge && icon && (
        <motion.div
          key={badge.id}
          className="badge-toast"
          initial={{ opacity: 0, y: -18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <span className="badge-toast__tag">Badge Unlocked!</span>
          <GameIcon src={icon} alt={badge.name} size="lg" className="badge-toast__icon" />
          <div className="badge-toast__info">
            <span className="badge-toast__name">{badge.name}</span>
            <span className="badge-toast__desc">{badge.description}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
