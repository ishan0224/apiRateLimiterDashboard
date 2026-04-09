export const MAX_RANGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type TimeZoneValue = "browser" | string;

export type QuickRangeKey =
  | "last_5_minutes"
  | "last_15_minutes"
  | "last_30_minutes"
  | "last_1_hour"
  | "last_3_hours"
  | "last_6_hours"
  | "last_12_hours"
  | "last_24_hours"
  | "last_2_days"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "today"
  | "this_week"
  | "this_month"
  | "this_year"
  | "yesterday"
  | "previous_week"
  | "previous_month"
  | "previous_year";

export type QuickRangeSectionKey = "rolling" | "calendar" | "previous";

type CivilDate = {
  year: number;
  month: number;
  day: number;
};

export type TimeZoneOption = {
  value: TimeZoneValue;
  label: string;
};

export type QuickRangeDefinition = {
  key: QuickRangeKey;
  label: string;
  section: QuickRangeSectionKey;
  compute: (anchor: Date, timeZone: TimeZoneValue) => { from: Date; to: Date };
};

const fallbackTimeZone = "UTC";

const commonTimeZoneOptions: TimeZoneOption[] = [
  { value: "browser", label: "Browser time" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];

function clone(date: Date) {
  return new Date(date.getTime());
}

function subtractMinutes(anchor: Date, minutes: number) {
  return new Date(anchor.getTime() - minutes * 60 * 1000);
}

function subtractHours(anchor: Date, hours: number) {
  return new Date(anchor.getTime() - hours * 60 * 60 * 1000);
}

function subtractDays(anchor: Date, days: number) {
  return new Date(anchor.getTime() - days * 24 * 60 * 60 * 1000);
}

function civilToUtcDate(civil: CivilDate) {
  return new Date(Date.UTC(civil.year, civil.month - 1, civil.day));
}

function shiftCivilDays(civil: CivilDate, diffDays: number): CivilDate {
  const shifted = civilToUtcDate(civil);
  shifted.setUTCDate(shifted.getUTCDate() + diffDays);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function shiftCivilMonths(civil: CivilDate, diffMonths: number): CivilDate {
  const shifted = civilToUtcDate({ year: civil.year, month: civil.month, day: 1 });
  shifted.setUTCMonth(shifted.getUTCMonth() + diffMonths);

  const monthStart = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0));
  const clampedDay = Math.min(civil.day, monthEnd.getUTCDate());
  monthStart.setUTCDate(clampedDay);

  return {
    year: monthStart.getUTCFullYear(),
    month: monthStart.getUTCMonth() + 1,
    day: monthStart.getUTCDate(),
  };
}

function shiftCivilYears(civil: CivilDate, diffYears: number): CivilDate {
  const shifted = civilToUtcDate(civil);
  shifted.setUTCFullYear(shifted.getUTCFullYear() + diffYears);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function resolveTimeZone(timeZone: TimeZoneValue): string {
  if (timeZone && timeZone !== "browser") {
    return timeZone;
  }

  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return browserTimeZone || fallbackTimeZone;
}

function parseShortOffset(timeZoneName: string): number {
  if (!timeZoneName) {
    return 0;
  }

  const match = timeZoneName.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2] ?? "0");
  const minutes = Number(match[3] ?? "0");

  return sign * (hours * 60 + minutes) * 60 * 1000;
}

function getTimeZoneOffsetMs(date: Date, timeZone: TimeZoneValue): number {
  const resolved = resolveTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: resolved,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "shortOffset",
  });

  const timeZoneName =
    formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "";

  return parseShortOffset(timeZoneName);
}

export function getTimeZoneOffsetMinutes(timeZone: TimeZoneValue, referenceDate = new Date()) {
  return Math.round(getTimeZoneOffsetMs(referenceDate, timeZone) / (60 * 1000));
}

export function formatTimeZoneIndicator(timeZone: TimeZoneValue, referenceDate = new Date()) {
  const resolved = resolveTimeZone(timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, referenceDate);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${resolved} · UTC${sign}${hours}:${minutes}`;
}

export function getZonedDateParts(date: Date, timeZone: TimeZoneValue): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const resolved = resolveTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolved,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

export function zonedDateTimeToUtc(
  input: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  timeZone: TimeZoneValue
): Date {
  const guessedUtcMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second,
    0
  );

  const firstOffset = getTimeZoneOffsetMs(new Date(guessedUtcMs), timeZone);
  let correctedUtcMs = guessedUtcMs - firstOffset;

  const secondOffset = getTimeZoneOffsetMs(new Date(correctedUtcMs), timeZone);
  if (secondOffset !== firstOffset) {
    correctedUtcMs = guessedUtcMs - secondOffset;
  }

  return new Date(correctedUtcMs);
}

export function getUtcDateForCivilDay(civil: CivilDate, timeZone: TimeZoneValue): Date {
  return zonedDateTimeToUtc(
    {
      year: civil.year,
      month: civil.month,
      day: civil.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone
  );
}

export function getCivilDateInTimeZone(date: Date, timeZone: TimeZoneValue): CivilDate {
  const parts = getZonedDateParts(date, timeZone);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

export function toCivilKey(civil: CivilDate): string {
  return `${civil.year}-${String(civil.month).padStart(2, "0")}-${String(civil.day).padStart(2, "0")}`;
}

export function getDayKeyInTimeZone(date: Date, timeZone: TimeZoneValue): string {
  return toCivilKey(getCivilDateInTimeZone(date, timeZone));
}

export function startOfDayInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  return getUtcDateForCivilDay(civil, timeZone);
}

export function endOfDayInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  const nextDay = shiftCivilDays(civil, 1);
  return new Date(getUtcDateForCivilDay(nextDay, timeZone).getTime() - 1);
}

export function startOfWeekInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  const weekday = civilToUtcDate(civil).getUTCDay();
  const distanceFromMonday = (weekday + 6) % 7;
  const weekStart = shiftCivilDays(civil, -distanceFromMonday);
  return getUtcDateForCivilDay(weekStart, timeZone);
}

export function endOfWeekInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const weekStart = getCivilDateInTimeZone(startOfWeekInTimeZone(date, timeZone), timeZone);
  const nextWeekStart = shiftCivilDays(weekStart, 7);
  return new Date(getUtcDateForCivilDay(nextWeekStart, timeZone).getTime() - 1);
}

export function startOfMonthInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  return getUtcDateForCivilDay({ year: civil.year, month: civil.month, day: 1 }, timeZone);
}

export function endOfMonthInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  const nextMonthStartCivil = shiftCivilMonths({ year: civil.year, month: civil.month, day: 1 }, 1);
  return new Date(getUtcDateForCivilDay(nextMonthStartCivil, timeZone).getTime() - 1);
}

export function startOfYearInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  return getUtcDateForCivilDay({ year: civil.year, month: 1, day: 1 }, timeZone);
}

export function endOfYearInTimeZone(date: Date, timeZone: TimeZoneValue): Date {
  const civil = getCivilDateInTimeZone(date, timeZone);
  const nextYearStart = shiftCivilYears({ year: civil.year, month: 1, day: 1 }, 1);
  return new Date(getUtcDateForCivilDay(nextYearStart, timeZone).getTime() - 1);
}

const QUICK_RANGES: QuickRangeDefinition[] = [
  {
    key: "last_5_minutes",
    label: "Last 5 minutes",
    section: "rolling",
    compute: (anchor) => ({ from: subtractMinutes(anchor, 5), to: clone(anchor) }),
  },
  {
    key: "last_15_minutes",
    label: "Last 15 minutes",
    section: "rolling",
    compute: (anchor) => ({ from: subtractMinutes(anchor, 15), to: clone(anchor) }),
  },
  {
    key: "last_30_minutes",
    label: "Last 30 minutes",
    section: "rolling",
    compute: (anchor) => ({ from: subtractMinutes(anchor, 30), to: clone(anchor) }),
  },
  {
    key: "last_1_hour",
    label: "Last 1 hour",
    section: "rolling",
    compute: (anchor) => ({ from: subtractHours(anchor, 1), to: clone(anchor) }),
  },
  {
    key: "last_3_hours",
    label: "Last 3 hours",
    section: "rolling",
    compute: (anchor) => ({ from: subtractHours(anchor, 3), to: clone(anchor) }),
  },
  {
    key: "last_6_hours",
    label: "Last 6 hours",
    section: "rolling",
    compute: (anchor) => ({ from: subtractHours(anchor, 6), to: clone(anchor) }),
  },
  {
    key: "last_12_hours",
    label: "Last 12 hours",
    section: "rolling",
    compute: (anchor) => ({ from: subtractHours(anchor, 12), to: clone(anchor) }),
  },
  {
    key: "last_24_hours",
    label: "Last 24 hours",
    section: "rolling",
    compute: (anchor) => ({ from: subtractHours(anchor, 24), to: clone(anchor) }),
  },
  {
    key: "last_2_days",
    label: "Last 2 days",
    section: "rolling",
    compute: (anchor) => ({ from: subtractDays(anchor, 2), to: clone(anchor) }),
  },
  {
    key: "last_7_days",
    label: "Last 7 days",
    section: "rolling",
    compute: (anchor) => ({ from: subtractDays(anchor, 7), to: clone(anchor) }),
  },
  {
    key: "last_30_days",
    label: "Last 30 days",
    section: "rolling",
    compute: (anchor) => ({ from: subtractDays(anchor, 30), to: clone(anchor) }),
  },
  {
    key: "last_90_days",
    label: "Last 90 days",
    section: "rolling",
    compute: (anchor) => ({ from: subtractDays(anchor, 90), to: clone(anchor) }),
  },
  {
    key: "today",
    label: "Today",
    section: "calendar",
    compute: (anchor, timeZone) => ({ from: startOfDayInTimeZone(anchor, timeZone), to: clone(anchor) }),
  },
  {
    key: "this_week",
    label: "This week",
    section: "calendar",
    compute: (anchor, timeZone) => ({ from: startOfWeekInTimeZone(anchor, timeZone), to: clone(anchor) }),
  },
  {
    key: "this_month",
    label: "This month",
    section: "calendar",
    compute: (anchor, timeZone) => ({ from: startOfMonthInTimeZone(anchor, timeZone), to: clone(anchor) }),
  },
  {
    key: "this_year",
    label: "This year",
    section: "calendar",
    compute: (anchor, timeZone) => ({ from: startOfYearInTimeZone(anchor, timeZone), to: clone(anchor) }),
  },
  {
    key: "yesterday",
    label: "Yesterday",
    section: "previous",
    compute: (anchor, timeZone) => {
      const civil = getCivilDateInTimeZone(anchor, timeZone);
      const previousDay = shiftCivilDays(civil, -1);
      const from = getUtcDateForCivilDay(previousDay, timeZone);
      const to = new Date(getUtcDateForCivilDay(civil, timeZone).getTime() - 1);
      return { from, to };
    },
  },
  {
    key: "previous_week",
    label: "Previous week",
    section: "previous",
    compute: (anchor, timeZone) => {
      const currentWeekStart = startOfWeekInTimeZone(anchor, timeZone);
      const previousWeekEnd = new Date(currentWeekStart.getTime() - 1);
      return {
        from: startOfWeekInTimeZone(previousWeekEnd, timeZone),
        to: endOfWeekInTimeZone(previousWeekEnd, timeZone),
      };
    },
  },
  {
    key: "previous_month",
    label: "Previous month",
    section: "previous",
    compute: (anchor, timeZone) => {
      const currentMonthStart = startOfMonthInTimeZone(anchor, timeZone);
      const previousMonthEnd = new Date(currentMonthStart.getTime() - 1);
      return {
        from: startOfMonthInTimeZone(previousMonthEnd, timeZone),
        to: endOfMonthInTimeZone(previousMonthEnd, timeZone),
      };
    },
  },
  {
    key: "previous_year",
    label: "Previous year",
    section: "previous",
    compute: (anchor, timeZone) => {
      const currentYearStart = startOfYearInTimeZone(anchor, timeZone);
      const previousYearEnd = new Date(currentYearStart.getTime() - 1);
      return {
        from: startOfYearInTimeZone(previousYearEnd, timeZone),
        to: endOfYearInTimeZone(previousYearEnd, timeZone),
      };
    },
  },
];

const quickRangeByKey = new Map<QuickRangeKey, QuickRangeDefinition>(
  QUICK_RANGES.map((item) => [item.key, item])
);

export const QUICK_RANGE_SECTIONS: Array<{ key: QuickRangeSectionKey; items: QuickRangeDefinition[] }> = [
  { key: "rolling", items: QUICK_RANGES.filter((item) => item.section === "rolling") },
  { key: "calendar", items: QUICK_RANGES.filter((item) => item.section === "calendar") },
  { key: "previous", items: QUICK_RANGES.filter((item) => item.section === "previous") },
];

export function getTimeZoneOptions(preferredTimeZone?: string | null): TimeZoneOption[] {
  const browserTimeZone = preferredTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone;
  const browserLabel = browserTimeZone ? `Browser time (${browserTimeZone})` : "Browser time";

  const base: TimeZoneOption[] = [{ value: "browser", label: browserLabel }, ...commonTimeZoneOptions.filter((option) => option.value !== "browser")];
  if (browserTimeZone && !base.some((option) => option.value === browserTimeZone)) {
    base.splice(1, 0, { value: browserTimeZone, label: browserTimeZone });
  }

  const deduped: TimeZoneOption[] = [];
  const seen = new Set<string>();
  for (const option of base) {
    const key = option.value;
    if (!seen.has(key)) {
      deduped.push(option);
      seen.add(key);
    }
  }

  return deduped;
}

export function isQuickRangeKey(value: string | null): value is QuickRangeKey {
  if (!value) {
    return false;
  }

  return quickRangeByKey.has(value as QuickRangeKey);
}

export function computeQuickRange(
  key: QuickRangeKey,
  anchor = new Date(),
  timeZone: TimeZoneValue = "browser"
) {
  const definition = quickRangeByKey.get(key);
  if (!definition) {
    return { from: subtractHours(anchor, 24), to: clone(anchor) };
  }

  return definition.compute(anchor, timeZone);
}

export function getQuickRangeLabel(key: QuickRangeKey) {
  return quickRangeByKey.get(key)?.label ?? "Custom range";
}

export function formatInputDateTime(value: Date, timeZone: TimeZoneValue = "browser") {
  const parts = getZonedDateParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}`;
}

export function formatRangeDateTime(value: Date, timeZone: TimeZoneValue = "browser") {
  const parts = getZonedDateParts(value, timeZone);
  return `${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")}/${parts.year} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}`;
}

export function formatRangeLabel(
  from: Date,
  to: Date,
  quickRangeKey: QuickRangeKey | null,
  timeZone: TimeZoneValue = "browser"
) {
  if (quickRangeKey) {
    return getQuickRangeLabel(quickRangeKey);
  }

  return `${formatRangeDateTime(from, timeZone)} to ${formatRangeDateTime(to, timeZone)}`;
}

export function isValidRange(from: Date, to: Date, maxWindowMs = MAX_RANGE_WINDOW_MS) {
  const fromMs = from.getTime();
  const toMs = to.getTime();

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return false;
  }

  if (fromMs >= toMs) {
    return false;
  }

  if (toMs - fromMs > maxWindowMs) {
    return false;
  }

  return true;
}

function parseAbsoluteInput(value: string, timeZone: TimeZoneValue): Date | null {
  const direct = new Date(value);
  const hasExplicitOffset = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  if (!Number.isNaN(direct.getTime()) && hasExplicitOffset) {
    return direct;
  }

  const normalized = value.trim().replace("T", " ");
  const match = normalized.match(/^\s*(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?\s*$/);
  if (!match) {
    if (!Number.isNaN(direct.getTime())) {
      return direct;
    }

    return null;
  }

  const [, yearText, monthText, dayText, hh = "00", mm = "00", ss = "00"] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);

  if ([year, month, day, hour, minute, second].some((numberValue) => !Number.isFinite(numberValue))) {
    return null;
  }

  return zonedDateTimeToUtc(
    {
      year,
      month,
      day,
      hour,
      minute,
      second,
    },
    timeZone
  );
}

export function parseTimeExpression(
  raw: string,
  anchor = new Date(),
  timeZone: TimeZoneValue = "browser"
): Date | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();
  if (lower === "now") {
    return clone(anchor);
  }

  const minusMatch = lower.match(/^now-(\d+)([mhd])$/);
  if (minusMatch) {
    const [, amountText, unit] = minusMatch;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    if (unit === "m") {
      return subtractMinutes(anchor, amount);
    }

    if (unit === "h") {
      return subtractHours(anchor, amount);
    }

    return subtractDays(anchor, amount);
  }

  const roundMatch = lower.match(/^now\/([dwm])$/);
  if (roundMatch) {
    const token = roundMatch[1];
    if (token === "d") {
      return startOfDayInTimeZone(anchor, timeZone);
    }

    if (token === "w") {
      return startOfWeekInTimeZone(anchor, timeZone);
    }

    return startOfMonthInTimeZone(anchor, timeZone);
  }

  return parseAbsoluteInput(value, timeZone);
}

export function detectMatchingQuickRange(
  from: Date,
  to: Date,
  anchor = new Date(),
  timeZone: TimeZoneValue = "browser",
  toleranceMs = 1500
): QuickRangeKey | null {
  for (const item of QUICK_RANGES) {
    const expected = item.compute(anchor, timeZone);
    if (
      Math.abs(expected.from.getTime() - from.getTime()) <= toleranceMs &&
      Math.abs(expected.to.getTime() - to.getTime()) <= toleranceMs
    ) {
      return item.key;
    }
  }

  return null;
}
