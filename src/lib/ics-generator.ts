
import type { Event } from './types';
// No longer needed: import { format } from 'date-fns-tz';

/**
 * Generates an iCalendar (.ics) file content string from an array of events.
 * Assumes event.startTime and event.endTime are already valid ISO 8601 UTC strings (YYYYMMDDTHHmmssZ).
 *
 * @param events - An array of Event objects.
 * @returns A string containing the .ics file content.
 */
export function generateICS(events: Event[]): string {
  console.log("[generateICS] Starting ICS generation for events count:", events.length);

  // Helper to format the current timestamp for DTSTAMP
  const formatDtstamp = (): string => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = now.getUTCDate().toString().padStart(2, '0');
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    const seconds = now.getUTCSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };


  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartSchedule//Event Exporter//EN
CALSCALE:GREGORIAN
`;

  events.forEach((event, index) => {
    console.log(`[generateICS] Processing event ${index + 1} - Title: ${event.title}`);
    const uid = `smartschedule-${Date.now()}-${index}@example.com`; // Simple unique ID
    const dtstamp = formatDtstamp(); // Creation timestamp

    // Directly use the pre-formatted ISO strings from the event object
    const dtstart = event.startTime;
    const dtend = event.endTime;

    // Basic validation on the strings (ensure they look like ISO UTC)
    const isoUtcRegex = /^\d{4}\d{2}\d{2}T\d{2}\d{2}\d{2}Z$/;
     const dtstartIcsFormatted = dtstart.replace(/[-:]/g, ''); // Convert YYYY-MM-DDTHH:MM:SSZ to YYYYMMDDTHHMMSSZ
     const dtendIcsFormatted = dtend.replace(/[-:]/g, '');     // Convert YYYY-MM-DDTHH:MM:SSZ to YYYYMMDDTHHMMSSZ


    if (!isoUtcRegex.test(dtstartIcsFormatted) || !isoUtcRegex.test(dtendIcsFormatted)) {
        console.warn(`[generateICS] Skipping event "${event.title}" due to invalid pre-formatted ISO string: START=${dtstartIcsFormatted}, END=${dtendIcsFormatted}`);
        return; // Skip this event
    }

    console.log(`[generateICS] Event ${index + 1} - Title: ${event.title}, DTSTART: ${dtstartIcsFormatted}, DTEND: ${dtendIcsFormatted}`);

    // Escape special characters in description and summary
    const escapeICS = (str: string): string => {
        return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstartIcsFormatted}
DTEND:${dtendIcsFormatted}
SUMMARY:${escapeICS(event.title || 'Untitled Event')}
DESCRIPTION:${escapeICS(event.description || '')}
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  console.log("[generateICS] Finished ICS generation.");
  return icsContent;
}
