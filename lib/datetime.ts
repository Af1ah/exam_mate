/**
 * Parses Postgres timestamptz strings returned by Prisma Next.
 *
 * Postgres may emit offsets such as `+00`, while JavaScript's ISO parser
 * requires the full `+00:00` form.
 */
export function parseDatabaseTimestamp(value?: string | Date | null): number {
  if (!value) return Number.NaN;
  if (value instanceof Date) return value.getTime();

  const isoTimestamp = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  return Date.parse(isoTimestamp);
}
