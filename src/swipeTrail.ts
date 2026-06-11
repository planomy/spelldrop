export const SWIPE_THRESHOLD = 8
export const TRAIL_MIN_DIST = 6

export function buildTrailPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const midX = (curr.x + next.x) / 2
    const midY = (curr.y + next.y) / 2
    d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`
  }
  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

export function toStageCoords(
  clientX: number,
  clientY: number,
  stageRect: DOMRect,
): { x: number; y: number } {
  return {
    x: clientX - stageRect.left,
    y: clientY - stageRect.top,
  }
}
