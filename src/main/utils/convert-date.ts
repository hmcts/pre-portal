export function formatDateToDDMMYYYY(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function isValidDateString(s: string | undefined) {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/.test(s);
}
export function toIsoDateString(s: string | undefined): string {
  if (!s) return '';

  const ukMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return `${year}-${month}-${day}`;
  }

  const isoMatch = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
  if (isoMatch.test(s)) {
    return s;
  }

  return '';
}
