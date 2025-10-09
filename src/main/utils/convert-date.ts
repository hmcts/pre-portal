export function formatDateToDDMMYYYY(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Use native Intl.DateTimeFormat for formatting
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/London'
  });

  return dateFormatter.format(date).replace(',', '');
}

export function toIsoDateString(s: string | undefined): string {
  if (!s) return '';

  const isoMatch = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
  if (isoMatch.test(s)) {
    return s;
  }

  const ukMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return `${year}-${month}-${day}`;
  }

  return '';
}
