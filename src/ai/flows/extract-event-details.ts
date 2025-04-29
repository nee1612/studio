
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
      "An image of a timetable, schedule, class routine, or calendar, provided as a data URI. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractEventDetailsInput = z.infer<typeof ExtractEventDetailsInputSchema>;

// Define the expected structure for a single event within the array output
const EventSchema = z.object({
    title: z.string().describe('The title, subject name, or main label of the event (e.g., "Physics Lecture", "Chemistry Lab", "Team Meeting"). Extract this accurately from the corresponding entry in the timetable.'),
    startTime: z.string().datetime({ offset: true }).describe('The exact start date and time of the event in ISO 8601 format (e.g., "2024-09-21T09:00:00Z" or "2024-09-21T14:30:00+05:30"). If the date (day, month, year) is not explicitly mentioned for the specific event, infer it based on the context of the timetable (e.g., assume the current year, look for a date range specified for the week/month, or use a specific date mentioned elsewhere in the image). Accurately parse time formats (including AM/PM) and time zones if present, converting everything to UTC (Z suffix) or including the correct offset.'),
    endTime: z.string().datetime({ offset: true }).describe('The exact end date and time of the event in ISO 8601 format (e.g., "2024-09-21T10:30:00Z" or "2024-09-21T16:00:00+05:30"). Infer the date similarly to startTime. Ensure the end time is logically after the start time and corresponds to the event duration shown in the timetable.'),
    description: z.string().optional().describe('Optional: Any relevant additional details like location (e.g., "Room 301", "Hall B"), instructor name, topic, or notes associated with the event. Extract this if clearly associated with the event entry.'),
});


const ExtractEventDetailsOutputSchema = z.array(EventSchema).describe("An array containing all extracted event objects. Each object must strictly follow the EventSchema. If no events are found or the image is unreadable, return an empty array [].");
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
  prompt: `You are an expert AI assistant specialized in accurately extracting structured event information from images of timetables, schedules, class routines, or calendars.

Analyze the provided image meticulously. Identify each distinct event entry, often found in table cells corresponding to specific days and times. For each event found, extract the following details according to the defined output schema:

1.  **title**: Extract the subject name, course title, or event label (e.g., "Mathematics", "History 101", "Project Sync"). This is usually the most prominent text within the event's cell.
2.  **startTime**: Determine the exact start date and time.
    *   **Time:** Parse the time indicated for the event's beginning (e.g., "9:00 AM", "13:30"). Handle AM/PM correctly.
    *   **Date:** If the date (day, month, year) is specified for the event or its corresponding day column/row, use it. If only the day of the week is mentioned, look for a date range or a starting date elsewhere in the image (e.g., "Week of Sep 16, 2024") to infer the full date. If no year is present, assume the current year based on the system clock unless context suggests otherwise.
    *   **Format:** Convert the final date and time to the ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+HH:mm). Use UTC (Z) if possible, otherwise include the time offset.
3.  **endTime**: Determine the exact end date and time, following the same logic as startTime. Ensure the end time reflects the event's duration as shown in the timetable (e.g., if an event spans from 9:00 AM to 10:30 AM).
4.  **description**: (Optional) Extract any additional relevant information associated with the event, such as location (room number, building), instructor name, or specific topic, if present within or adjacent to the event's entry.

**Processing Guidelines:**
*   **Accuracy is paramount:** Pay close attention to details, especially times, dates, and subject titles. Do not guess if information is ambiguous.
*   **Structure Awareness:** Recognize common timetable structures (grids, lists). Associate titles, times, and descriptions correctly based on their position.
*   **Date Inference:** Be logical when inferring dates. If a timetable covers a week, calculate the correct date for each day based on a reference point if available.
*   **Empty Output:** If the image is unclear, illegible, or contains no discernible timetable events, return an empty JSON array \`[]\`.
*   **No Hallucination:** Only extract information explicitly present or logically inferable from the image content. Do not add unrelated details.
*   **Strict Formatting:** Ensure the output is a valid JSON array where *each* element strictly adheres to the \`EventSchema\` (keys: "title", "startTime", "endTime", "description"?).

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

