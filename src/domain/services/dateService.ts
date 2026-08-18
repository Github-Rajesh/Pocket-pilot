export function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export function isInsideRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date < end;
}

export function daysInCurrentMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export function remainingDaysInMonth(now = new Date()) {
  return Math.max(daysInCurrentMonth(now) - now.getDate() + 1, 1);
}

export function daysUntilDayOfMonth(day: number, now = new Date()) {
  const clampedDay = Math.min(Math.max(day, 1), 28);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), clampedDay);

  if (thisMonth >= startOfToday(now)) {
    return Math.ceil((thisMonth.getTime() - startOfToday(now).getTime()) / 86400000);
  }

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, clampedDay);
  return Math.ceil((nextMonth.getTime() - startOfToday(now).getTime()) / 86400000);
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
