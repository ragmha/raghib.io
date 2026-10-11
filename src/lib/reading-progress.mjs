export function activeSection(positions, readingTop) {
  let active = 0
  for (let index = 0; index < positions.length; index++) {
    if (positions[index] > readingTop) break
    active = index
  }
  return active
}

// Map document distance to the corresponding segment of the contents rail.
export function railPosition(points, documentY) {
  if (points.length === 0) return 0
  if (documentY <= points[0].documentY) return points[0].railY
  for (let index = 1; index < points.length; index++) {
    const end = points[index]
    if (documentY > end.documentY) continue
    const start = points[index - 1]
    const distance = end.documentY - start.documentY
    if (distance <= 0) return end.railY
    const progress = (documentY - start.documentY) / distance
    return start.railY + progress * (end.railY - start.railY)
  }
  return points[points.length - 1].railY
}
