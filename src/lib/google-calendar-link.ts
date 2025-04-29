
import type { Event } from './types';

/**
 * Generates a Google Calendar event creation URL with pre-filled details.
 * See: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 *
 * @param event - An Event object containing ISO 8601 UTC strings for startTime and endTime.
 * @returns A string containing the Google Calendar URL, or null if dates are invalid.
 */
export function generateGoogleCalendarLink(event: Event): string | null {
  const formatDateGoogle = (isoDateString: string): string | null => {
    try {
      // Validate the ISO string format first
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(isoDateString)) {
         throw new Error(`Invalid ISO 8601 UTC format: ${isoDateString}`);
      }
      // Convert YYYY-MM-DDTHH:MM:SSZ to YYYYMMDDTHHmmssZ
      return isoDateString.replace(/[-:]/g, '');
    } catch (error) {
      console.error("Error formatting date for Google Calendar link:", error, "Original value:", isoDateString);
      return null; // Indicate error
    }
  };

  const baseURL = 'https://www.google.com/calendar/render?action=TEMPLATE';

  const title = encodeURIComponent(event.title || 'Untitled Event');
  const startTimeFormatted = formatDateGoogle(event.startTime);
  const endTimeFormatted = formatDateGoogle(event.endTime);
  const details = encodeURIComponent(event.description || '');

  // Basic validation
  if (!startTimeFormatted || !endTimeFormatted) {
    console.warn(`Skipping Google Calendar link generation for "${event.title}" due to invalid date format.`);
    return null; // Return null if dates are invalid
  }

  const dates = `${startTimeFormatted}/${endTimeFormatted}`;

  // Construct the URL
  const url = `${baseURL}&text=${title}&dates=${dates}&details=${details}`;

  return url;
}
