/** IANA — não use "UTC-3" em `timeZone` (inválido no Intl). */
export const BR_TIMEZONE = "America/Sao_Paulo"

export function parseBackendDateTime(isoLike: string): Date {
  const s = isoLike.trim()
  if (!s) return new Date(NaN)
  if (/Z$/i.test(s)) return new Date(s)
  if (/[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s)) return new Date(s)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s))
    return new Date(`${s.replace(/Z$/i, "")}Z`)
  return new Date(s)
}

/** Returns true iff created_at is strictly more than `days` × 24 h ago. Returns false for null or unparseable values. */
export function isOlderThanDays(created_at: string | null, days: number): boolean {
  if (!created_at) return false
  const parsed = parseBackendDateTime(created_at)
  if (Number.isNaN(parsed.getTime())) return false
  return Date.now() - parsed.getTime() > days * 24 * 60 * 60 * 1000
}

/** Data/hora em Brasília; sufixo só informativo (o fuso real é America/Sao_Paulo). */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseBackendDateTime(date) : date
  const formatted = d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: BR_TIMEZONE,
  })
  return `${formatted}`
}
