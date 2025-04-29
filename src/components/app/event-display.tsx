'use client';

import * as React from 'react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, InfoIcon, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateGoogleCalendarLink } from '@/lib/google-calendar-link';

interface EventDisplayProps {
  events: Event[];
}

export function EventDisplay({ events }: EventDisplayProps) {
  // Format a single UTC date object into 12-hour AM/PM time string (e.g., "10:00 AM")
  const formatSingleTime = (date: Date): string => {
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Format startTime and endTime as a 12-hour UTC time range (e.g., "10:00 AM - 11:00 AM")
  const formatTimeRange = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid Time';
      }

      const formattedStartTime = formatSingleTime(start);
      const formattedEndTime = formatSingleTime(end);

      return `${formattedStartTime} - ${formattedEndTime}`;
    } catch (error) {
      console.error('Error formatting time range:', error, 'Start:', startTime, 'End:', endTime);
      return 'Invalid Time';
    }
  };

  // Format the date for the calendar (e.g., "Apr 28, 2025")
  const formatDate = (date: string): string => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      // Format using UTC date parts to avoid timezone shifting the date itself
      // 'PPP' inherently uses local settings, but since we construct from ISO string
      // which includes timezone info (or implies UTC via 'Z'), this should be okay.
      // However, to be absolutely sure, we could use date-fns-tz if needed,
      // but for just the date, this is usually fine.
      return format(dateObj, 'PPP'); // Format like: Apr 28, 2025
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', date);
      return 'Invalid Date';
    }
  };

  if (events.length === 0) {
    return null; // Don't render anything if there are no events
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4 text-center">Extracted Events</h2>
      {events.map((event, index) => {
         // Ensure event times are valid before generating link
        const startTimeValid = event.startTime && !isNaN(new Date(event.startTime).getTime());
        const endTimeValid = event.endTime && !isNaN(new Date(event.endTime).getTime());
        const googleLink = startTimeValid && endTimeValid ? generateGoogleCalendarLink(event) : null;

        return (
          <Card
            key={index}
            className="shadow-sm transition-shadow duration-300 hover:shadow-md overflow-hidden"
          >
            <CardHeader className="bg-secondary/50 p-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-primary" />
                {event.title || 'Untitled Event'}
              </CardTitle>
              {/* Add to Google Calendar Button */}
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={!googleLink} // Disable if link couldn't be generated (e.g., invalid dates)
              >
                <a href={googleLink || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Add to Google
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <CalendarIcon className="h-4 w-4 text-accent" />
                {/* Use startTime for the date display, as it's consistent */}
                <span>{startTimeValid ? formatDate(event.startTime as string) : 'Invalid Date'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <ClockIcon className="h-4 w-4 text-accent" />
                <span>{startTimeValid && endTimeValid ? formatTimeRange(event.startTime as string, event.endTime as string) : 'Invalid Time'}</span>
              </div>
              {event.description && (
                <CardDescription className="pt-2 text-foreground">
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
