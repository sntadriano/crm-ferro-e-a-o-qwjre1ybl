/**
 * Converts a yyyy-MM-dd date string to an ISO UTC string representing
 * the start of that day (00:00:00) in the user's local timezone.
 * @param dateStr - Date in yyyy-MM-dd format
 * @returns ISO UTC string (e.g. "2024-01-15T03:00:00.000Z" for UTC-3)
 */
export const toDateFilterStart = (dateStr: string): string => {
  return new Date(dateStr + 'T00:00:00').toISOString()
}

/**
 * Converts a yyyy-MM-dd date string to an ISO UTC string representing
 * the end of that day (23:59:59.999) in the user's local timezone.
 * @param dateStr - Date in yyyy-MM-dd format
 * @returns ISO UTC string (e.g. "2024-01-16T02:59:59.999Z" for UTC-3)
 */
export const toDateFilterEnd = (dateStr: string): string => {
  return new Date(dateStr + 'T23:59:59.999').toISOString()
}

export const toDateTimeLocal = (isoStr: string): string => {
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
