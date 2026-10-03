const STRICT_INSTANT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;

/**
 * Parses only an explicit, calendar-valid timestamp with a UTC designator or
 * numeric offset. Unlike Date.parse(), this rejects normalized impossible
 * calendar/time values such as February 30 or 24:00.
 */
export function parseStrictInstant(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = STRICT_INSTANT_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = match[7] ?? "";
  const zone = match[8];
  const offsetHour = Number(match[10] ?? "0");
  const offsetMinute = Number(match[11] ?? "0");

  if (
    month < 1 || month > 12
    || day < 1 || day > 31
    || hour < 0 || hour > 23
    || minute < 0 || minute > 59
    || second < 0 || second > 59
    || offsetHour < 0 || offsetHour > 23
    || offsetMinute < 0 || offsetMinute > 59
  ) {
    return null;
  }

  const millisecond = Number((fraction + "000").slice(0, 3));
  const local = new Date(0);
  local.setUTCFullYear(year, month - 1, day);
  local.setUTCHours(hour, minute, second, millisecond);

  if (
    local.getUTCFullYear() !== year
    || local.getUTCMonth() !== month - 1
    || local.getUTCDate() !== day
    || local.getUTCHours() !== hour
    || local.getUTCMinutes() !== minute
    || local.getUTCSeconds() !== second
    || local.getUTCMilliseconds() !== millisecond
  ) {
    return null;
  }

  let offsetMinutes = 0;
  if (zone !== "Z") {
    const direction = match[9] === "+" ? 1 : -1;
    offsetMinutes = direction * (offsetHour * 60 + offsetMinute);
  }

  const instant = local.getTime() - offsetMinutes * 60_000;
  return Number.isFinite(instant) ? instant : null;
}
