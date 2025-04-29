
'use server';

import { extractEventDetails, ExtractEventDetailsOutput } from '@/ai/flows/extract-event-details';
// import { validateExtractedDetails } from '@/ai/flows/validate-extracted-details'; // Validation logic can be added back if needed
import type { Event } from '@/lib/types';

/**
 * Extracts event details from a timetable image data URI, validates them,
 * and returns the processed events.
 *
 * @param timetableImageDataUri - The data URI of the timetable image.
 * @returns A promise that resolves to an array of validated Event objects, or null if extraction/validation fails.
 */
export async function extractAndProcessEvents(timetableImageDataUri: string): Promise<Event[] | null> {
  console.log('Starting event extraction...');
  try {
    // 1. Extract details using AI
    const extractedDetailsArray: ExtractEventDetailsOutput = await extractEventDetails({ timetableImageDataUri });

    if (!extractedDetailsArray || extractedDetailsArray.length === 0) {
      console.log('AI extraction returned no events.');
      return []; // Return empty array if nothing was extracted
    }

    console.log(`Extracted ${extractedDetailsArray.length} potential events.`);

    // 2. Basic validation and structuring (Validation using AI can be re-introduced if needed)
    const validatedEvents: Event[] = [];

    for (const rawEvent of extractedDetailsArray) {
       // Basic check for essential fields before processing
       if (!rawEvent.title || !rawEvent.startTime || !rawEvent.endTime) {
           console.warn('Skipping raw event due to missing essential fields:', rawEvent);
           continue;
       }

        try {
             // Perform basic validation on the ISO strings if needed (e.g., regex)
             // For now, trust the AI format based on the prompt
             const isValidStartTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(rawEvent.startTime);
             const isValidEndTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(rawEvent.endTime);

             if (!isValidStartTime || !isValidEndTime) {
                 console.warn(`Skipping event "${rawEvent.title}" due to invalid ISO 8601 UTC date string format.`);
                 continue;
             }

             // Directly use the ISO strings provided by the AI
             validatedEvents.push({
                title: rawEvent.title,
                startTime: rawEvent.startTime, // Use raw string
                endTime: rawEvent.endTime,   // Use raw string
                description: rawEvent.description || '', // Ensure description is always a string
             });

        } catch (processingError) {
            console.error(`Error processing event "${rawEvent.title}":`, processingError);
             // Decide how to handle: skip, log, etc.
        }
    }


    console.log(`Successfully processed ${validatedEvents.length} events.`);
    return validatedEvents;

  } catch (error) {
    console.error('Error during event extraction or processing:', error);
    // Propagate the error message or a generic one
     throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred during event processing.');
  }
}
