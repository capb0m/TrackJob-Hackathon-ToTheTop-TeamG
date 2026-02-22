export function getCurrentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function getCurrentYear() {
  return new Date().getUTCFullYear()
}

export function isoNow() {
  return new Date().toISOString()
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
