
import type { Event } from './types';
import { format } from 'date-fns-tz';

/**
 * Generates a Google Calendar event creation URL with pre-filled details.
 * See: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 *
 * @param event - An Event object.
 * @returns A string containing the Google Calendar URL, or null if dates are invalid.
 */
export function generateGoogleCalendarLink(event: Event): string | null {
  const formatDateGoogle = (date: Date | string): string | null => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date object');
      }
      // Format date to Google Calendar format (YYYYMMDDTHHmmssZ) in UTC
      return format(dateObj, "yyyyMMdd'T'HHmmss'Z'", { timeZone: 'UTC' });
    } catch (error) {
      console.error("Error formatting date for Google Calendar link:", error, "Original value:", date);
      return null; // Indicate error
    }
  };

  const baseURL = 'https://www.google.com/calendar/render?action=TEMPLATE';

  const title = encodeURIComponent(event.title || 'Untitled Event');
  const startTime = formatDateGoogle(event.startTime);
  const endTime = formatDateGoogle(event.endTime);
  const details = encodeURIComponent(event.description || '');

  // Basic validation
  if (!startTime || !endTime) {
    console.warn(`Skipping Google Calendar link generation for "${event.title}" due to invalid date format.`);
    return null; // Return null if dates are invalid
  }

  const dates = `${startTime}/${endTime}`;

  // Construct the URL
  const url = `${baseURL}&text=${title}&dates=${dates}&details=${details}`;

  return url;
}
