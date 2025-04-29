'use client';

import * as React from 'react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Info, ExternalLink } from 'lucide-react'; // Using more specific icons
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateGoogleCalendarLink } from '@/lib/google-calendar-link';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface EventDisplayProps {
  events: Event[];
}

export function EventDisplay({ events }: EventDisplayProps) {
  // Format startTime and endTime as a 12-hour UTC time range (e.g., "10:00 AM - 11:00 AM")
  const formatTimeRange = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid Time';
      }

      // Function to format a single time
      const formatSingleTime = (date: Date): string => {
        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
        return `${hours}:${minutesStr} ${ampm}`;
      };

      const formattedStartTime = formatSingleTime(start);
      const formattedEndTime = formatSingleTime(end);

      // Determine AM/PM for the range. Usually, they are the same, but handle edge cases like 11:30 AM - 12:30 PM.
      const startAmpm = start.getUTCHours() >= 12 ? 'PM' : 'AM';
      const endAmpm = end.getUTCHours() >= 12 ? 'PM' : 'AM';

      // Simplified representation: Show AM/PM based on the end time for consistency unless it crosses noon significantly.
      // For simplicity, let's just use the end time's AM/PM marker.
      return `${formattedStartTime} - ${formattedEndTime}`;

    } catch (error) {
      console.error('Error formatting time range:', error, 'Start:', startTime, 'End:', endTime);
      return 'Invalid Time';
    }
  };

  // Format the date for the calendar (e.g., "Apr 28, 2025")
  const formatDate = (dateString: string): string => {
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      // Use date-fns format, which handles locale well. 'PPP' gives "Month Day, Year"
      return format(dateObj, 'PPP');
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', dateString);
      return 'Invalid Date';
    }
  };

  if (events.length === 0) {
    return null; // Don't render anything if there are no events
  }

  return (
    <div className="space-y-5"> {/* Increased spacing */}
      <h2 className="text-2xl font-semibold mb-5 text-center text-foreground/90">Extracted Schedule</h2>
      {events.map((event, index) => {
         // Ensure event times are valid before generating link
        const startTimeValid = event.startTime && !isNaN(new Date(event.startTime as string).getTime());
        const endTimeValid = event.endTime && !isNaN(new Date(event.endTime as string).getTime());
        const googleLink = startTimeValid && endTimeValid ? generateGoogleCalendarLink(event) : null;

        return (
          <Card
            key={index}
            className={cn(
              "shadow-md transition-all duration-300 hover:shadow-lg overflow-hidden border-border/70 bg-card rounded-xl", // Enhanced styling
              "animate-fade-in", // Apply fade-in animation
              // Stagger animation using CSS utility class (ensure these are defined in globals.css)
              `animation-delay-${index * 100}ms`
            )}
            // Fallback inline style for browsers that might not pick up utility class immediately
             style={{ animationFillMode: 'backwards', animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="bg-gradient-to-r from-card to-secondary/20 p-4 border-b border-border/50 flex flex-row items-center justify-between space-x-4">
              <div className="flex items-center gap-3 min-w-0"> {/* Added min-w-0 for truncation */}
                <Info className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle className="text-lg font-semibold truncate text-card-foreground" title={event.title || 'Untitled Event'}> {/* Added truncate */}
                  {event.title || 'Untitled Event'}
                </CardTitle>
              </div>
              {/* Add to Google Calendar Button */}
              <Button
                variant="outline"
                size="sm"
                asChild={!!googleLink} // Only use asChild if link is valid
                disabled={!googleLink}
                className={cn(
                    "flex-shrink-0 bg-background hover:bg-accent/10 transition-colors border-input",
                    !googleLink && "opacity-50 cursor-not-allowed" // Style disabled state
                )}
                title={googleLink ? "Add this event to Google Calendar" : "Cannot add event (invalid date/time)"}
              >
                 {googleLink ? (
                    <a href={googleLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Add to Google
                    </a>
                ) : (
                    // Render a disabled-looking button text if link is null
                    <span className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Add to Google
                    </span>
                )}
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3"> {/* Increased padding and spacing */}
              <div className="flex items-center text-sm text-muted-foreground gap-2.5">
                <CalendarDays className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-medium">{startTimeValid ? formatDate(event.startTime as string) : 'Invalid Date'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2.5">
                <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-medium">{startTimeValid && endTimeValid ? formatTimeRange(event.startTime as string, event.endTime as string) : 'Invalid Time'}</span>
              </div>
              {event.description && (
                <CardDescription className="pt-3 text-foreground/80 text-sm italic border-t border-border/30 mt-4">
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
