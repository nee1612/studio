'use client';

import * as React from 'react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Info, ExternalLink, CalendarPlus } from 'lucide-react'; // Using more specific icons
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateGoogleCalendarLink } from '@/lib/google-calendar-link';
import { cn } from '@/lib/utils';

interface EventDisplayProps {
  events: Event[];
}

export function EventDisplay({ events }: EventDisplayProps) {
  // Format startTime and endTime as a 12-hour UTC time range (e.g., "10:00 AM - 11:00 AM")
  const formatTimeRange = (startTime: Date | string, endTime: Date | string): string => {
    try {
      const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
      const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid Time';
      }

      const formatSingleTime = (date: Date): { time: string; ampm: string } => {
        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
        return { time: `${hours}:${minutesStr}`, ampm };
      };

      const startFormatted = formatSingleTime(start);
      const endFormatted = formatSingleTime(end);

      // Show AM/PM only once if they are the same
      if (startFormatted.ampm === endFormatted.ampm) {
        return `${startFormatted.time} - ${endFormatted.time} ${endFormatted.ampm}`;
      } else {
        // Show AM/PM for both if different (e.g., 11:00 AM - 1:00 PM)
        return `${startFormatted.time} ${startFormatted.ampm} - ${endFormatted.time} ${endFormatted.ampm}`;
      }
    } catch (error) {
      console.error('Error formatting time range:', error, 'Start:', startTime, 'End:', endTime);
      return 'Invalid Time';
    }
  };

  // Format the date for the calendar (e.g., "Apr 28, 2025")
  const formatDate = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return format(dateObj, 'EEE, MMM d, yyyy'); // E.g., Mon, Apr 28, 2025
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', date);
      return 'Invalid Date';
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold mb-6 text-center text-foreground/90 tracking-wide">Extracted Schedule</h2> {/* Wider tracking */}
      {events.map((event, index) => {
        const startTimeValid = event.startTime && !isNaN(new Date(event.startTime as string).getTime());
        const endTimeValid = event.endTime && !isNaN(new Date(event.endTime as string).getTime());
        const googleLink = startTimeValid && endTimeValid ? generateGoogleCalendarLink(event) : null;

        return (
          <Card
            key={index}
            className={cn(
              "shadow-lg transition-all duration-300 hover:shadow-primary/20 overflow-hidden border border-border/50 bg-card rounded-xl group glow-on-hover", // Added group for hover effects within card and glow
              "animate-fade-in",
              `animation-delay-${index * 100}ms` // Stagger animation
            )}
             style={{ animationFillMode: 'backwards', animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between space-x-4 bg-gradient-to-r from-card via-card to-secondary/10"> {/* Subtle gradient header */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-primary/10 rounded-md">
                   <Info className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <CardTitle className="text-lg font-semibold truncate text-card-foreground" title={event.title || 'Untitled Event'}>
                  {event.title || 'Untitled Event'}
                </CardTitle>
              </div>
              {/* Add to Google Calendar Button (Individual) */}
               <Button
                 variant="ghost"
                 size="icon" // Make it an icon button
                 asChild={!!googleLink}
                 disabled={!googleLink}
                 className={cn(
                     "flex-shrink-0 text-accent hover:bg-accent/10 hover:text-accent-foreground transition-all duration-200 rounded-full w-8 h-8 p-0 glow-on-hover", // Icon specific styling
                     !googleLink && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-accent"
                 )}
                 title={googleLink ? "Add this event to Google Calendar" : "Cannot add event (invalid date/time)"}
               >
                  {googleLink ? (
                     <a href={googleLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                     <CalendarPlus className="h-4 w-4" /> {/* Just the icon */}
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
                <span className="font-medium">{startTimeValid ? formatDate(event.startTime) : 'Invalid Date'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2.5 group-hover:text-foreground/90 transition-colors duration-200">
                <Clock className="h-4 w-4 text-primary/80 flex-shrink-0" />
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
