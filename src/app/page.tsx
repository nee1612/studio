'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/app/image-uploader';
import { EventDisplay } from '@/components/app/event-display';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/lib/types';
import { extractAndProcessEvents } from './actions';
import { generateICS } from '@/lib/ics-generator';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


export default function Home() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (dataUri: string) => {
    setImageDataUri(dataUri);
    setEvents([]); // Clear previous events
    setError(null); // Clear previous errors
    setIsLoading(true);

    try {
      const extractedEvents = await extractAndProcessEvents(dataUri);
      if (extractedEvents) {
        setEvents(extractedEvents);
         toast({
          title: "Events Extracted",
          description: `Successfully extracted ${extractedEvents.length} events.`,
        });
      } else {
         throw new Error("No events extracted or an error occurred.");
      }
    } catch (err: any) {
      console.error('Error extracting events:', err);
      const errorMessage = err.message || 'Failed to extract events from the image. Please try again with a clearer image.';
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportICS = () => {
    if (events.length === 0) {
       toast({
        variant: "destructive",
        title: "No Events to Export",
        description: "Please upload a timetable and extract events first.",
      });
      return;
    }
    try {
      const icsContent = generateICS(events);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'schedule.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
       toast({
        title: "Export Successful",
        description: "Your schedule has been downloaded as schedule.ics.",
      });
    } catch (err) {
      console.error('Error generating ICS:', err);
       toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate the ICS file.",
      });
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center">
      <header className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary-foreground bg-primary py-2 px-4 rounded-lg inline-block shadow">
          SmartSchedule
        </h1>
        <p className="text-lg text-muted-foreground">
          Upload your timetable image, and we'll extract the events for you.
        </p>
      </header>

      <div className="w-full max-w-3xl mb-8">
        <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />
      </div>

       {error && (
         <Alert variant="destructive" className="w-full max-w-3xl mb-8">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>
             {error}
           </AlertDescription>
         </Alert>
       )}

      {isLoading && (
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="w-full max-w-3xl">
          <EventDisplay events={events} />
          <div className="mt-6 text-center">
            <Button onClick={handleExportICS} size="lg">
              <Download className="mr-2 h-5 w-5" />
              Export as ICS
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !imageDataUri && events.length === 0 && !error && (
        <div className="text-center text-muted-foreground mt-10">
          <p>Upload an image of your timetable to get started.</p>
        </div>
      )}

       {!isLoading && imageDataUri && events.length === 0 && !error && (
        <div className="text-center text-muted-foreground mt-10">
          <p>No events found in the uploaded image.</p>
           <p>Try uploading a clearer image or a different timetable format.</p>
        </div>
      )}


    </main>
  );
}
