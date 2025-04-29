
import type { Event } from './types';
import { format } from 'date-fns-tz'; // Ensure this import is correct

/**
 * Generates an iCalendar (.ics) file content string from an array of events.
 *
 * @param events - An array of Event objects.
 * @returns A string containing the .ics file content.
 */
export function generateICS(events: Event[]): string {
  console.log("[generateICS] Starting ICS generation for events count:", events.length);

  const formatDateICS = (label: string, date: Date | string): string => {
     try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date object for ${label}`);
        }
        // Log the Date object before formatting (in UTC ISO format for clarity)
        console.log(`[formatDateICS] Formatting ${label}: Input Date object: ${dateObj.toISOString()}`);

        // Format date to ICS format (YYYYMMDDTHHmmssZ) in UTC
        const formattedDate = format(dateObj, "yyyyMMdd'T'HHmmss'Z'", { timeZone: 'UTC' });

        // Log the formatted date
        console.log(`[formatDateICS] Formatted ${label}: Output ICS Date: ${formattedDate}`);

        return formattedDate;
     } catch (error) {
        console.error(`[formatDateICS] Error formatting date for ${label}:`, error, "Original value:", date);
        return 'INVALID_DATE';
     }
  };


  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartSchedule//Event Exporter//EN
CALSCALE:GREGORIAN
`;
// Optional: Add a VTIMEZONE component if specific timezone handling beyond UTC is needed,
// but pure UTC (ending with Z) is usually preferred for simplicity and compatibility.
/*
icsContent += `BEGIN:VTIMEZONE
TZID:Etc/UTC
BEGIN:STANDARD
DTSTART:19700101T000000Z
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:UTC
END:STANDARD
END:VTIMEZONE
`;
*/

  events.forEach((event, index) => {
    console.log(`[generateICS] Processing event ${index + 1} - Title: ${event.title}`);
    const uid = `smartschedule-${Date.now()}-${index}@example.com`; // Simple unique ID
    const dtstamp = formatDateICS('DTSTAMP', new Date()); // Creation timestamp
    const dtstart = formatDateICS('DTSTART', event.startTime);
    const dtend = formatDateICS('DTEND', event.endTime);

    // Basic validation before adding event
    if (dtstart === 'INVALID_DATE' || dtend === 'INVALID_DATE') {
        console.warn(`[generateICS] Skipping event "${event.title}" due to invalid date format.`);
        return; // Skip this event
    }

    console.log(`[generateICS] Event ${index + 1} - Title: ${event.title}, DTSTART: ${dtstart}, DTEND: ${dtend}`);

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

  console.log("[generateICS] Finished ICS generation.");
  return icsContent;
}
