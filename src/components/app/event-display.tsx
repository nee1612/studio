
'use client';

import * as React from 'react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Info, CalendarPlus, Download } from 'lucide-react'; // Added Download
import { format, parseISO } from 'date-fns'; // Use parseISO for string dates
import { utcToZonedTime } from 'date-fns-tz'; // Needed if we want to display in a specific TZ, but for UTC display it's simpler
import { Button } from '@/components/ui/button';
import { generateGoogleCalendarLink } from '@/lib/google-calendar-link';
import { cn } from '@/lib/utils';

interface EventDisplayProps {
  events: Event[];
}

export function EventDisplay({ events }: EventDisplayProps) {
  // Format startTime and endTime (which are ISO UTC strings) as a 12-hour UTC time range (e.g., "10:00 AM - 11:00 AM UTC")
  const formatTimeRange = (startTimeIso: string, endTimeIso: string): string => {
    try {
      // Parse the ISO strings into Date objects. They will represent UTC time.
      const start = parseISO(startTimeIso);
      const end = parseISO(endTimeIso);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid Date objects parsed from ISO strings:', startTimeIso, endTimeIso);
        return 'Invalid Time';
      }

      // Function to format a single Date object into HH:MM AM/PM format in UTC
      const formatSingleTimeUTC = (date: Date): { time: string; ampm: string } => {
        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Handle midnight (0) as 12 AM
        const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
        return { time: `${hours}:${minutesStr}`, ampm };
      };

      const startFormatted = formatSingleTimeUTC(start);
      const endFormatted = formatSingleTimeUTC(end);

      // Construct the range string
      if (startFormatted.ampm === endFormatted.ampm) {
        // Same AM/PM, show only once
        return `${startFormatted.time} - ${endFormatted.time} ${endFormatted.ampm} UTC`;
      } else {
        // Different AM/PM (e.g., crosses noon or midnight)
        return `${startFormatted.time} ${startFormatted.ampm} - ${endFormatted.time} ${endFormatted.ampm} UTC`;
      }
    } catch (error) {
      console.error('Error formatting time range:', error, 'Start:', startTimeIso, 'End:', endTimeIso);
      return 'Invalid Time';
    }
  };

  // Format the date part of the ISO string (e.g., "Apr 28, 2025")
  // This still assumes the *date* part represents the intended local date, even though time is UTC
  // If the date needs to be interpreted in a specific timezone for display, use utcToZonedTime
  const formatDate = (dateIso: string): string => {
    try {
      const dateObj = parseISO(dateIso);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      // Format using date-fns, interpreting the date parts in UTC
      // Use formatWithOptions if specific locale needed, default is usually fine
      return format(dateObj, 'MMM d, yyyy', { timeZone: 'UTC' }); // Explicitly format based on UTC date parts
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', dateIso);
      return 'Invalid Date';
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold mb-6 text-center text-foreground/90 tracking-wide">Extracted Schedule</h2>
      {events.map((event, index) => {
        // Validation happens in actions.ts now, but good practice to double-check
        const startTimeValid = event.startTime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(event.startTime);
        const endTimeValid = event.endTime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(event.endTime);
        const googleLink = startTimeValid && endTimeValid ? generateGoogleCalendarLink(event) : null;

        return (
          <Card
            key={index}
            className={cn(
              "shadow-lg transition-all duration-300 hover:shadow-primary/20 overflow-hidden border border-border/50 bg-card rounded-xl group glow-on-hover",
              "animate-fade-in",
              `animation-delay-${index * 100}ms` // Stagger animation
            )}
             style={{ animationFillMode: 'backwards', animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between space-x-4 bg-gradient-to-r from-card via-card to-secondary/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-primary/10 rounded-md">
                   <Info className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <CardTitle className="text-lg font-semibold truncate text-card-foreground" title={event.title || 'Untitled Event'}>
                  {event.title || 'Untitled Event'}
                </CardTitle>
              </div>
               <Button
                 variant="ghost"
                 size="icon"
                 asChild={!!googleLink}
                 disabled={!googleLink}
                 className={cn(
                     "flex-shrink-0 text-accent hover:bg-accent/10 hover:text-accent-foreground transition-all duration-200 rounded-full w-8 h-8 p-0 glow-on-hover",
                     !googleLink && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-accent"
                 )}
                 title={googleLink ? "Add this event to Google Calendar" : "Cannot add event (invalid date/time)"}
               >
                  {googleLink ? (
                     <a href={googleLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                     <CalendarPlus className="h-4 w-4" />
                     </a>
                 ) : (
                     <span className="flex items-center justify-center">
                         <CalendarPlus className="h-4 w-4" />
                     </span>
                 )}
               </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center text-sm text-muted-foreground gap-2.5 group-hover:text-foreground/90 transition-colors duration-200">
                <CalendarDays className="h-4 w-4 text-primary/80 flex-shrink-0" />
                {/* Format the date part of the startTime */}
                <span className="font-medium">{startTimeValid ? formatDate(event.startTime) : 'Invalid Date'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2.5 group-hover:text-foreground/90 transition-colors duration-200">
                <Clock className="h-4 w-4 text-primary/80 flex-shrink-0" />
                {/* Format the time range using both startTime and endTime */}
                <span className="font-medium">{startTimeValid && endTimeValid ? formatTimeRange(event.startTime, event.endTime) : 'Invalid Time'}</span>
              </div>
              {event.description && (
                <CardDescription className="pt-3 text-foreground/70 text-sm italic border-t border-border/20 mt-4 group-hover:text-foreground/80 transition-colors duration-200">
                  {event.description}
                </CardDescription>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
