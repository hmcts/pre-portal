export function formatDateToDDMMYYYY(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
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
