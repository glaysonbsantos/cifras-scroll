export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const average = mean(values)
  const variance = mean(values.map((value) => (value - average) ** 2))
  return Math.sqrt(variance)
}

export function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0
  const ordered = [...values].sort((a, b) => a - b)
  const index = Math.min(ordered.length - 1, Math.floor(quantile * ordered.length))
  return ordered[index] ?? 0
}
