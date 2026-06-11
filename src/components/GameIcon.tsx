import './GameIcon.css'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  src: string
  alt: string
  size?: Size
  className?: string
}

export default function GameIcon({ src, alt, size = 'md', className = '' }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={`game-icon game-icon--${size}${className ? ` ${className}` : ''}`}
      draggable={false}
    />
  )
}
