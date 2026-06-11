import { BADGES } from '../progression'
import { badgeIcon } from '../icons'
import GameIcon from './GameIcon'
import './SetupBadgeShelf.css'

interface Props {
  unlockedBadgeIds: string[]
}

export default function SetupBadgeShelf({ unlockedBadgeIds }: Props) {
  return (
    <div className="setup-badge-shelf" aria-label="Badge collection">
      {BADGES.map((badge) => {
        const icon = badgeIcon(badge.id)
        if (!icon) return null

        const earned = unlockedBadgeIds.includes(badge.id)
        const status = earned ? 'Earned' : 'Locked'

        return (
          <div
            key={badge.id}
            className={`setup-badge-shelf__slot ${earned ? 'setup-badge-shelf__slot--earned' : 'setup-badge-shelf__slot--locked'}`}
            title={`${badge.name} — ${badge.description}${earned ? '' : ' (not earned yet)'}`}
          >
            <GameIcon
              src={icon}
              alt={`${badge.name} badge`}
              size="lg"
              className="setup-badge-shelf__icon"
            />
            <span className="setup-badge-shelf__status">{status}</span>
            <span className="setup-badge-shelf__name">{badge.name}</span>
          </div>
        )
      })}
    </div>
  )
}
