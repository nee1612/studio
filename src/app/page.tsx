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
import { Terminal, UploadCloud, CalendarX2, Sparkles, AlertCircle, Download } from "lucide-react";
import { generateICS } from '@/lib/ics-generator';


export default function Home() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icsContent, setIcsContent] = useState<string | null>(null); // State for ICS content
  const { toast } = useToast();

  const handleImageUpload = async (dataUri: string) => {
    setImageDataUri(dataUri);
    setEvents([]); // Clear previous events
    setError(null); // Clear previous errors
    setIcsContent(null); // Clear previous ICS content
    setIsLoading(true);

    try {
      const extractedEvents = await extractAndProcessEvents(dataUri);
      if (extractedEvents && extractedEvents.length > 0) {
        setEvents(extractedEvents);
        const generatedIcs = generateICS(extractedEvents); // Generate ICS content
        setIcsContent(generatedIcs);
         toast({
          title: "Events Extracted Successfully!",
          description: `Found ${extractedEvents.length} events. Review and manage them below.`,
          variant: 'default',
        });
      } else {
         setEvents([]);
         setIcsContent(null);
          toast({
           variant: "default",
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageDataUri(null);
    setEvents([]);
    setError(null);
    setIcsContent(null);
    setIsLoading(false);
  };

   // Function to trigger ICS file download
   const handleDownloadICS = () => {
    if (!icsContent || events.length === 0) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "No schedule data available to download.",
      });
      return;
    }

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "schedule.ics");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up Blob URL

     toast({
      title: "Download Started",
      description: "Your schedule.ics file is downloading.",
      variant: 'default',
    });
  };


  return (
    <main className="container mx-auto px-4 py-8 md:px-8 md:py-12 min-h-screen flex flex-col items-center bg-gradient-to-br from-background via-background to-secondary/30">
      <header className="w-full max-w-4xl text-center mb-12 md:mb-16">
         <div className="inline-block p-3 mb-4 bg-primary/10 rounded-full border border-primary/30 shadow-lg shadow-primary/10 glow-on-hover">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
         </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary/80 tracking-tight">
          SmartSchedule AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Instantly turn your timetable image into a digital schedule. Upload, verify, and export effortlessly.
        </p>
      </header>

      <div className="w-full max-w-2xl mb-12 md:mb-16">
        <div className="glow-on-hover rounded-xl">
            <ImageUploader
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              isLoading={isLoading}
              preview={imageDataUri}
            />
        </div>
      </div>

       {error && (
         <Alert variant="destructive" className="w-full max-w-2xl mb-8 animate-fade-in shadow-lg border-destructive/70 bg-destructive/10 rounded-xl">
           <AlertCircle className="h-5 w-5" />
           <AlertTitle className="font-semibold text-lg">Oops! Something went wrong.</AlertTitle>
           <AlertDescription>
             {error} Please check the image or try uploading again.
           </AlertDescription>
         </Alert>
       )}

      {isLoading && !error && (
        <div className="w-full max-w-3xl space-y-5 animate-pulse mt-6">
           <div className="flex justify-center mb-4">
              <p className="text-muted-foreground font-medium text-lg tracking-wider">EXTRACTING SCHEDULE...</p>
           </div>
          <Skeleton className="h-28 w-full rounded-lg bg-muted/60" />
          <Skeleton className="h-28 w-full rounded-lg bg-muted/60 animation-delay-100ms" />
          <Skeleton className="h-28 w-full rounded-lg bg-muted/60 animation-delay-200ms" />
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="w-full max-w-3xl mt-6 animate-fade-in space-y-6">
           {/* Add Export All button */}
          <div className="flex justify-center">
            <Button onClick={handleDownloadICS} disabled={!icsContent} className="glow-on-hover">
              <Download className="mr-2 h-4 w-4" /> Export All Events (.ics)
            </Button>
          </div>
          <EventDisplay events={events} />
        </div>
      )}

      {!isLoading && !imageDataUri && events.length === 0 && !error && (
        <div className="text-center text-muted-foreground mt-16 flex flex-col items-center animate-fade-in space-y-5 p-10 border border-dashed border-border/40 rounded-xl bg-card/50 max-w-md mx-auto shadow-inner shadow-background/30">
           <UploadCloud className="w-20 h-20 text-primary/60 stroke-1 mb-2" />
          <h3 className="text-xl font-semibold text-foreground/90">Ready to Digitize Your Schedule?</h3>
          <p className="text-base">Upload an image of your timetable above to begin.</p>
           <p className="text-xs text-muted-foreground/70">(Supported formats: PNG, JPG, WEBP)</p>
        </div>
      )}

       {!isLoading && imageDataUri && events.length === 0 && !error && (
         <div className="text-center text-muted-foreground mt-16 flex flex-col items-center animate-fade-in space-y-5 p-10 border border-dashed border-destructive/40 rounded-xl bg-destructive/10 max-w-md mx-auto shadow-inner shadow-destructive/5">
           <CalendarX2 className="w-20 h-20 text-destructive/60 stroke-1 mb-2" />
            <h3 className="text-xl font-semibold text-destructive/90">No Events Detected</h3>
           <p className="text-base">We couldn't seem to find any schedule entries in that image.</p>
           <p className="mt-1 text-xs text-muted-foreground/70">Try uploading a clearer image or ensure it's a supported timetable format.</p>
            <Button variant="outline" size="sm" onClick={handleRemoveImage} className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/20 hover:text-destructive-foreground transition-colors duration-200 glow-on-hover">
                Upload New Image
            </Button>
         </div>
      )}

      <footer className="mt-20 text-center text-muted-foreground text-xs w-full">
         Powered by <span className="font-semibold text-primary/80">GenAI</span> ✨ - Please verify extracted details before adding to your calendar.
      </footer>

    </main>
  );
}
