import { TITLE_LOGO } from '../icons'
import './GameLogo.css'

type Size = 'sm' | 'md' | 'lg' | 'hero'

interface Props {
  size?: Size
  className?: string
}

export default function GameLogo({ size = 'md', className = '' }: Props) {
  return (
    <img
      src={TITLE_LOGO}
      alt="Spell Drop"
      className={`game-logo game-logo--${size}${className ? ` ${className}` : ''}`}
      draggable={false}
    />
  )
}
