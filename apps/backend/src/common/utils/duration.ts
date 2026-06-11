const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Parses durations like "15m", "7d", "12h" into milliseconds. */
export function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}" (expected e.g. "15m", "7d")`);
  }
  const value = Number(match[1]);
  const unit = UNIT_MS[match[2] as string];
  if (!unit) {
    throw new Error(`Invalid duration unit in: "${duration}"`);
  }
  return value * unit;
}
