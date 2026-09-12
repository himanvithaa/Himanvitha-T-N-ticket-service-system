/**
 * Formats a UTC timestamp into the browser's local timezone.
 * Uses JavaScript's built-in Date object and toLocaleString.
 * Formats to a readable string like DD/MM/YYYY, HH:MM without hardcoding any specific timezone.
 *
 * @param {string|Date} dateStr - UTC timestamp from the server/database
 * @returns {string} Localized date/time string formatted as DD/MM/YYYY, HH:MM
 */
export function formatLocalDateTime(dateStr) {
  if (!dateStr) return 'N/A';

  try {
    let str = String(dateStr).trim();

    // Normalize SQLite UTC datetime format "YYYY-MM-DD HH:MM:SS" to ISO
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }

    // If no timezone offset (+/-HH:MM or Z) is present, treat as UTC by appending 'Z'
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
      str += 'Z';
    }

    const date = new Date(str);
    if (isNaN(date.getTime())) {
      // Fallback for unexpected formats
      const fallback = new Date(dateStr);
      if (!isNaN(fallback.getTime())) {
        return fallback.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      return String(dateStr);
    }

    // toLocaleString with 'en-GB' format renders DD/MM/YYYY, HH:MM
    // omitting timeZone ensures the browser's local timezone is automatically used
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return String(dateStr);
  }
}

export const formatDate = formatLocalDateTime;
