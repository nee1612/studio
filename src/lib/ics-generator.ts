import type { Event } from './types';
import { format } from 'date-fns-tz';

/**
 * Generates an iCalendar (.ics) file content string from an array of events.
 *
 * @param events - An array of Event objects.
 * @returns A string containing the .ics file content.
 */
export function generateICS(events: Event[]): string {
  const formatDateICS = (date: Date | string): string => {
     try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date object');
        }
        // Format date to ICS format (YYYYMMDDTHHmmssZ) in UTC
        return format(dateObj, "yyyyMMdd'T'HHmmss'Z'", { timeZone: 'UTC' });
     } catch (error) {
        console.error("Error formatting date for ICS:", error, "Original value:", date);
        // Return a placeholder or handle the error appropriately
        // For simplicity, returning an obviously invalid date string
        return 'INVALID_DATE';
     }
  };


  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartSchedule//Event Exporter//EN
CALSCALE:GREGORIAN
`;

  events.forEach((event, index) => {
    const uid = `smartschedule-${Date.now()}-${index}@example.com`; // Simple unique ID
    const dtstamp = formatDateICS(new Date()); // Creation timestamp
    const dtstart = formatDateICS(event.startTime);
    const dtend = formatDateICS(event.endTime);

    // Basic validation before adding event
    if (dtstart === 'INVALID_DATE' || dtend === 'INVALID_DATE') {
        console.warn(`Skipping event "${event.title}" due to invalid date format.`);
        return; // Skip this event
    }


    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.title || 'Untitled Event'}
DESCRIPTION:${event.description ? event.description.replace(/\n/g, '\\n') : ''}
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  return icsContent;
}
