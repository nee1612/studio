
'use server';
/**
 * @fileOverview Extracts event details from an image of a timetable using AI.
 *
 * - extractEventDetails - A function that takes an image of a timetable and returns a list of event details.
 * - ExtractEventDetailsInput - The input type for the extractEventDetails function, which includes the image data URI.
 * - ExtractEventDetailsOutput - The output type for the extractEventDetails function, which is a list of event objects.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// No longer importing Event from calendar.ts as we define the structure here


const ExtractEventDetailsInputSchema = z.object({
  timetableImageDataUri: z
    .string()
    .describe(
      "An image of a timetable, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractEventDetailsInput = z.infer<typeof ExtractEventDetailsInputSchema>;

// Define the expected structure for a single event within the array output
const EventSchema = z.object({
    title: z.string().describe('The title or name of the event (e.g., "Math Class", "Meeting with John").'),
    startTime: z.string().datetime({ offset: true }).describe('The start date and time of the event in ISO 8601 format (e.g., "2024-09-21T09:00:00Z"). Infer the date if not explicitly mentioned, assuming the current year or contextually relevant date.'),
    endTime: z.string().datetime({ offset: true }).describe('The end date and time of the event in ISO 8601 format (e.g., "2024-09-21T10:30:00Z"). Infer the date if not explicitly mentioned, assuming the current year or contextually relevant date.'),
    description: z.string().optional().describe('Optional: Any additional details or description associated with the event (e.g., "Room 101", "Project Discussion").'),
});


const ExtractEventDetailsOutputSchema = z.array(EventSchema).describe("An array containing all extracted event objects. If no events are found, return an empty array.");
export type ExtractEventDetailsOutput = z.infer<typeof ExtractEventDetailsOutputSchema>;


export async function extractEventDetails(input: ExtractEventDetailsInput): Promise<ExtractEventDetailsOutput> {
  console.log("Calling AI to extract event details...");
  try {
    const result = await extractEventDetailsFlow(input);
    console.log("AI extraction result:", result);
     // Ensure the result is always an array, even if the AI returns null/undefined somehow
     return Array.isArray(result) ? result : [];
  } catch (error) {
     console.error("Error in extractEventDetailsFlow:", error);
     // Return an empty array or re-throw depending on desired error handling
     return [];
  }
}


const extractEventDetailsPrompt = ai.definePrompt({
  name: 'extractEventDetailsPrompt',
  input: {
    schema: ExtractEventDetailsInputSchema, // Use the defined input schema
  },
  output: {
    schema: ExtractEventDetailsOutputSchema, // Use the defined output schema (array of events)
  },
  prompt: `You are an expert AI assistant specialized in accurately extracting structured event information from images of timetables, schedules, or calendars.

Analyze the provided image carefully. Identify each distinct event listed. For each event, extract the following details:
1.  **title**: The name or subject of the event.
2.  **startTime**: The exact start date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). If the date is not explicitly mentioned, infer it based on the context of the timetable (e.g., assume the current year if only day/month is given, or use a specific date mentioned elsewhere in the image). Accurately parse AM/PM notations and time zones if present, converting to UTC (Z).
3.  **endTime**: The exact end date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). Infer the date similar to startTime. Ensure the end time is logically after the start time.
4.  **description**: (Optional) Any relevant additional details like location, participants, or notes associated with the event. If no description is present, omit this field or leave it as an empty string.

Return the extracted information as a JSON array, where each element in the array is an object representing a single event with the keys "title", "startTime", "endTime", and optionally "description".

**Important:**
*   Pay close attention to date and time parsing. Be precise.
*   If the image is unclear or contains no discernible events, return an empty JSON array [].
*   Do not invent information. Only extract what is present or reasonably inferable from the image context.
*   Ensure the output strictly adheres to the JSON array format described.

Timetable Image: {{media url=timetableImageDataUri}}
`,
});


const extractEventDetailsFlow = ai.defineFlow<
  typeof ExtractEventDetailsInputSchema,
  typeof ExtractEventDetailsOutputSchema
>({
  name: 'extractEventDetailsFlow',
  inputSchema: ExtractEventDetailsInputSchema,
  outputSchema: ExtractEventDetailsOutputSchema,
}, async (input) => {
  console.log("Executing extractEventDetailsFlow with input:", input.timetableImageDataUri.substring(0, 50) + "..."); // Log start and truncated URI
  const { output } = await extractEventDetailsPrompt(input);
   console.log("Raw output from AI prompt:", output);

   // Basic validation: Ensure output is an array.
   if (!Array.isArray(output)) {
     console.warn("AI output was not an array. Returning empty array. Output:", output);
     return [];
   }

   // Further validation could be added here to check each event object structure if needed.

  return output; // Output should now be guaranteed to be an array (possibly empty)
});

