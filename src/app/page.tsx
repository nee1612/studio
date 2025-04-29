'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/app/image-uploader';
import { EventDisplay } from '@/components/app/event-display';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/lib/types';
import { extractAndProcessEvents } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, UploadCloud, CalendarX2, Sparkles } from "lucide-react";


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
      if (extractedEvents && extractedEvents.length > 0) {
        setEvents(extractedEvents);
         toast({
          title: "Events Extracted Successfully!",
          description: `Found ${extractedEvents.length} events. Review and add them to your calendar below.`,
          variant: 'default', // Use default for success
        });
      } else {
         // Handle case where extraction returns null or empty array
         setEvents([]); // Ensure events are empty
          toast({
           variant: "default", // Neutral message
           title: "No Events Found",
           description: "We couldn't find any schedule entries in the uploaded image. Try a different one?",
         });
      }
    } catch (err: any) {
      console.error('Error extracting events:', err);
      const errorMessage = err.message || 'Failed to extract events from the image. Please ensure the image is clear and shows a supported timetable format.';
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: errorMessage,
      });
       // Don't clear image on error, let user retry or remove manually
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageDataUri(null);
    setEvents([]);
    setError(null);
    setIsLoading(false);
  };


  return (
    <main className="container mx-auto px-4 py-8 md:px-8 md:py-12 min-h-screen flex flex-col items-center bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="w-full max-w-4xl text-center mb-12 md:mb-16">
         <div className="inline-block p-3 mb-4 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <Sparkles className="w-8 h-8 text-primary" />
         </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-foreground/80">
          SmartSchedule AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Instantly turn your timetable image into a digital schedule. Upload, verify, and export to your calendar effortlessly.
        </p>
      </header>

      <div className="w-full max-w-2xl mb-12 md:mb-16">
        <ImageUploader
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          isLoading={isLoading}
          preview={imageDataUri} // Pass preview state
        />
      </div>

       {error && (
         <Alert variant="destructive" className="w-full max-w-2xl mb-8 animate-fade-in shadow-md border-destructive/70">
           <Terminal className="h-5 w-5" />
           <AlertTitle className="font-semibold">Oops! Something went wrong.</AlertTitle>
           <AlertDescription>
             {error} Please check the image or try uploading again.
           </AlertDescription>
         </Alert>
       )}

      {/* Loading state - shows skeletons only *after* upload starts, before events are ready */}
      {isLoading && !error && (
        <div className="w-full max-w-3xl space-y-5 animate-pulse mt-6">
           <div className="flex justify-center mb-4">
              <p className="text-muted-foreground font-medium">Extracting schedule...</p>
           </div>
          <Skeleton className="h-24 w-full rounded-lg bg-muted/50" />
          <Skeleton className="h-24 w-full rounded-lg bg-muted/50 animation-delay-100ms" />
          <Skeleton className="h-24 w-full rounded-lg bg-muted/50 animation-delay-200ms" />
        </div>
      )}

      {/* Event Display Area - Shown when not loading and events exist */}
      {!isLoading && events.length > 0 && (
        <div className="w-full max-w-3xl mt-6">
          <EventDisplay events={events} />
        </div>
      )}

      {/* Initial Empty State - Before any image upload */}
      {!isLoading && !imageDataUri && events.length === 0 && !error && (
        <div className="text-center text-muted-foreground mt-16 flex flex-col items-center animate-fade-in space-y-4 p-8 border border-dashed border-border/50 rounded-lg bg-muted/20 max-w-md mx-auto">
           <UploadCloud className="w-16 h-16 text-primary/50 stroke-1" />
          <h3 className="text-xl font-semibold text-foreground/90">Ready to Schedule?</h3>
          <p className="text-sm">Upload an image of your timetable above to begin.</p>
           <p className="text-xs text-muted-foreground/80">(Supported formats: PNG, JPG, WEBP)</p>
        </div>
      )}

       {/* Empty State - After upload but no events found */}
       {!isLoading && imageDataUri && events.length === 0 && !error && (
         <div className="text-center text-muted-foreground mt-16 flex flex-col items-center animate-fade-in space-y-4 p-8 border border-dashed border-destructive/30 rounded-lg bg-destructive/5 max-w-md mx-auto">
           <CalendarX2 className="w-16 h-16 text-destructive/50 stroke-1" />
            <h3 className="text-xl font-semibold text-destructive/90">No Events Found</h3>
           <p className="text-sm">We couldn't detect any schedule entries in that image.</p>
           <p className="mt-1 text-xs text-muted-foreground/80">Try uploading a clearer image or ensure it's a supported timetable format.</p>
            <Button variant="outline" size="sm" onClick={handleRemoveImage} className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10">
                Upload New Image
            </Button>
         </div>
      )}

      <footer className="mt-20 text-center text-muted-foreground text-xs w-full">
         Powered by AI ✨ - Ensure extracted details are accurate before adding to calendar.
      </footer>

    </main>
  );
}
