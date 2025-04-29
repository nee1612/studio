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
  // Format startTime and endTime as a UTC time range (e.g., "10:00-11:00")
  const formatTimeRange = (startTimeInput: Date | string, endTimeInput: Date | string): string => {
    try {
      // Ensure inputs are strings before creating Date objects
      const startTime = typeof startTimeInput === 'string' ? startTimeInput : startTimeInput.toISOString();
      const endTime = typeof endTimeInput === 'string' ? endTimeInput : endTimeInput.toISOString();

      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Invalid time for formatting:", startTime, endTime)
        return 'Invalid Time';
      }

      // Extract hours and minutes in UTC
      const startHours = start.getUTCHours().toString().padStart(2, '0');
      const startMinutes = start.getUTCMinutes().toString().padStart(2, '0');
      const endHours = end.getUTCHours().toString().padStart(2, '0');
      const endMinutes = end.getUTCMinutes().toString().padStart(2, '0');

      return `${startHours}:${startMinutes}-${endHours}:${endMinutes}`;
    } catch (error) {
      console.error('Error formatting time range:', error, 'Start:', startTimeInput, 'End:', endTimeInput);
      return 'Invalid Time';
    }
  };

  // Format the date for the calendar (e.g., "Apr 28, 2025")
  const formatDate = (dateInput: Date | string): string => {
    try {
        const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date for formatting:", dateInput);
        return 'Invalid Date';
      }
      // Use UTC date parts to avoid timezone shifts during formatting
      const year = dateObj.getUTCFullYear();
      const month = dateObj.getUTCMonth(); // 0-indexed
      const day = dateObj.getUTCDate();
      // Create a new Date object using UTC values but interpreted as local for formatting
      // Or, more reliably, use date-fns format with explicit UTC consideration if needed,
      // but for just the date part PPP should be okay if the input Date object is correct.
      // If the AI consistently provides ISO strings, new Date(isoString) works fine.
      return format(dateObj, 'PPP'); // Format like: Apr 28, 2025
    } catch (error) {
      console.error('Error formatting date:', error, 'Original value:', dateInput);
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
                <span>{startTimeValid ? formatDate(event.startTime) : 'Invalid Date'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <ClockIcon className="h-4 w-4 text-accent" />
                <span>{startTimeValid && endTimeValid ? formatTimeRange(event.startTime, event.endTime) : 'Invalid Time'}</span>
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

// Simple fade-in animation using Tailwind (add this if needed)
// In globals.css or a dedicated animations file:
/*
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
*/