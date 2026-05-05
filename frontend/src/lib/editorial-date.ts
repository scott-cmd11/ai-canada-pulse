const EDITORIAL_TIME_ZONE = "America/Winnipeg"

export function getEditorialDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EDITORIAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    return date.toISOString().split("T")[0]
  }

  return `${year}-${month}-${day}`
}

export function addDaysToISODate(date: string, offsetDays: number): string {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + offsetDays)
  return next.toISOString().split("T")[0]
}
