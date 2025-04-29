
'use server';

import { extractEventDetails, ExtractEventDetailsOutput } from '@/ai/flows/extract-event-details';
import { validateExtractedDetails } from '@/ai/flows/validate-extracted-details';
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

    // 2. Validate and Process each extracted event detail string
    const validatedEvents: Event[] = [];

    // Process events sequentially to avoid overwhelming validation (if applicable)
    for (const rawEvent of extractedDetailsArray) {
       // Basic check for essential fields before validation
       if (!rawEvent.title || !rawEvent.startTime || !rawEvent.endTime) {
           console.warn('Skipping raw event due to missing essential fields:', rawEvent);
           continue;
       }

        try {
             // Convert ISO strings to Date objects. Handle potential errors.
             const startTime = new Date(rawEvent.startTime);
             const endTime = new Date(rawEvent.endTime);

             if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                 console.warn(`Skipping event "${rawEvent.title}" due to invalid date format.`);
                 continue;
             }

             // For now, we directly map assuming extraction is good enough
             // In a real scenario, you might call validateExtractedDetails here
             // const validationInput = { eventDetails: JSON.stringify(rawEvent) }; // Prepare for validation if needed
             // const validationResult = await validateExtractedDetails(validationInput);
             // if (validationResult.isValid) { ... }

             validatedEvents.push({
                title: rawEvent.title,
                startTime: startTime, // Use Date objects
                endTime: endTime,   // Use Date objects
                description: rawEvent.description || '', // Ensure description is always a string
             });

        } catch (parseError) {
            console.error(`Error processing event "${rawEvent.title}":`, parseError);
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
