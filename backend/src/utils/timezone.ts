/** Returns true for valid IANA timezone identifiers (e.g. America/New_York). */
export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}
