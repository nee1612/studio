
'use client';

import * as React from 'react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, InfoIcon, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateGoogleCalendarLink } from '@/lib/google-calendar-link'; // Import the new utility function

interface EventDisplayProps {
  events: Event[];
}

export function EventDisplay({ events }: EventDisplayProps) {

  const formatDate = (date: Date | string): string => {
    try {
       // Check if the date is already a Date object or needs parsing
       const dateObj = typeof date === 'string' ? new Date(date) : date;
       // Validate the date object
       if (isNaN(dateObj.getTime())) {
          return 'Invalid Date';
       }
      return format(dateObj, 'PPp'); // Format like: Sep 21, 2023, 2:00:00 PM
    } catch (error) {
      console.error("Error formatting date:", error, "Original value:", date);
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
          const googleLink = generateGoogleCalendarLink(event);
          return (
            <Card key={index} className="shadow-sm transition-shadow duration-300 hover:shadow-md overflow-hidden">
              <CardHeader className="bg-secondary/50 p-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                   <InfoIcon className="h-5 w-5 text-primary" />
                  {event.title || 'Untitled Event'}
                </CardTitle>
                 {/* Add to Google Calendar Button */}
                 <Button
                   variant="outline"
                   size="sm"
                   asChild // Use asChild to make the button act as a link
                   disabled={!googleLink} // Disable if link generation failed
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
                   <span>{formatDate(event.startTime)}</span>
                 </div>
                 <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <ClockIcon className="h-4 w-4 text-accent" />
                    <span>{formatDate(event.endTime)}</span>
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

