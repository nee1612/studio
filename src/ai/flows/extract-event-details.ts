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

const ExtractEventDetailsInputSchema = z.object({
  timetableImageDataUri: z
    .string()
    .describe(
      "An image of a timetable, schedule, class routine, or calendar, provided as a data URI. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractEventDetailsInput = z.infer<typeof ExtractEventDetailsInputSchema>;

const EventSchema = z.object({
    title: z.string().describe('The title, subject name, or main label of the event (e.g., "EH(IT-606)"). Extract this accurately from the corresponding entry in the timetable.'),
    startTime: z.string().datetime({ offset: true }).describe('The exact start date and time of the event in ISO 8601 format (e.g., "2025-04-28T10:00:00Z").'),
    endTime: z.string().datetime({ offset: true }).describe('The exact end date and time of the event in ISO 8601 format (e.g., "2025-04-28T11:00:00Z").'),
    description: z.string().optional().describe('Optional: Any relevant additional details like location, instructor name, topic, or notes.'),
});

const ExtractEventDetailsOutputSchema = z.array(EventSchema).describe("An array containing all extracted event objects.");
export type ExtractEventDetailsOutput = z.infer<typeof ExtractEventDetailsOutputSchema>;

export async function extractEventDetails(input: ExtractEventDetailsInput): Promise<ExtractEventDetailsOutput> {
  console.log("Calling AI to extract event details...");
  try {
    const result = await extractEventDetailsFlow(input);
    console.log("AI extraction result:", result);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error in extractEventDetailsFlow:", error);
    return [];
  }
}

const extractEventDetailsPrompt = ai.definePrompt({
  name: 'extractEventDetailsPrompt',
  input: {
    schema: ExtractEventDetailsInputSchema,
  },
  output: {
    schema: ExtractEventDetailsOutputSchema,
  },
  prompt: `
You are an expert AI assistant specialized in accurately extracting structured event information from images of timetables, schedules, class routines, or calendars.

The timetable in the image is structured as a grid with:
- Rows representing days of the week (Monday to Friday, labeled as "MON", "TUES", "WED", "THUS", "FRI").
- Columns representing time slots: 10-11AM, 11-12PM, 12-1PM, 1-2PM, 2-3PM.
- Each cell contains either a course code (e.g., "EH(IT-606)") or a single letter (e.g., "L", "U", "N", "C", "H") indicating a break or free period.

### Extraction Steps:
1. **Identify Events:**
   - Treat cells with course codes (e.g., "EH(IT-606)") as events.
   - Explicitly exclude cells with single letters ("L", "U", "N", "C", "H") as these indicate breaks (e.g., "L" for Lunch) and should not be extracted as events.

2. **Extract Event Details:**
   - **title**: Use the course code as the event title (e.g., "EH(IT-606)").
   - **startTime** and **endTime**:
     - Map the time slots to actual times:
       - "10-11AM": 10:00 to 11:00
       - "11-12PM": 11:00 to 12:00
       - "12-1PM": 12:00 to 13:00
       - "1-2PM": 13:00 to 14:00
       - "2-3PM": 14:00 to 15:00
     - Infer the date for each day based on the current date (April 29, 2025, which is a Tuesday):
       - MON: April 28, 2025
       - TUES: April 29, 2025
       - WED: April 30, 2025
       - THUS: May 1, 2025
       - FRI: May 2, 2025
     - Convert times to UTC (Z) in ISO 8601 format (e.g., "2025-04-28T10:00:00Z" for 10AM on Monday).
   - **description**: Leave as undefined unless additional details (e.g., room numbers) are present, which they are not in this timetable.

3. **Output Format:**
   - Return a JSON array of event objects.
   - Each event object must have "title", "startTime", and "endTime". Include "description" only if applicable.
   - If no events are found (e.g., only breaks), return an empty array [].

### Example Output:
For a cell with "EH(IT-606)" on Monday at 10-11AM:
{
  "title": "EH(IT-606)",
  "startTime": "2025-04-28T10:00:00Z",
  "endTime": "2025-04-28T11:00:00Z"
}

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
  console.log("Executing extractEventDetailsFlow with input:", input.timetableImageDataUri.substring(0, 50) + "...");
  const { output } = await extractEventDetailsPrompt(input);
  console.log("Raw output from AI prompt:", output);

  if (!Array.isArray(output)) {
    console.warn("AI output was not an array. Returning empty array. Output:", output);
    return [];
  }

  return output;
});