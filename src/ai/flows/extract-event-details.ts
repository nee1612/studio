
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
    startTime: z.string().datetime({ offset: true }).describe('The exact start date and time of the event in ISO 8601 UTC format (e.g., "2025-04-28T10:00:00Z").'),
    endTime: z.string().datetime({ offset: true }).describe('The exact end date and time of the event in ISO 8601 UTC format (e.g., "2025-04-28T11:00:00Z").'),
    description: z.string().optional().describe('Optional: Any relevant additional details like location, instructor name, topic, or notes.'),
});

const ExtractEventDetailsOutputSchema = z.array(EventSchema).describe("An array containing all extracted event objects.");
export type ExtractEventDetailsOutput = z.infer<typeof ExtractEventDetailsOutputSchema>;

export async function extractEventDetails(input: ExtractEventDetailsInput): Promise<ExtractEventDetailsOutput> {
  console.log("Calling AI to extract event details...");
  try {
    const result = await extractEventDetailsFlow(input);
    console.log("AI extraction result:", result);
    // Ensure result is always an array, even if the AI returns something unexpected.
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error in extractEventDetailsFlow:", error);
    // Return empty array on error to prevent breaking the frontend.
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

Analyze the provided timetable image. The timetable is structured as a grid with:
- **Rows** representing days of the week (Monday to Friday, labeled as "MON", "TUES", "WED", "THUS", "FRI").
- **Columns** representing time slots, clearly labeled at the top (e.g., "10-11AM", "11-12PM", "12-1PM", "1-2PM", "2-3PM").
- **Cells** contain either a course code (e.g., "EH(IT-606)") which represents an event, or a single letter (e.g., "L", "U", "N", "C", "H") indicating a break or free period.

**Your Task:** Extract all valid course events into a JSON array.

**Extraction Steps:**

1.  **Identify Events:**
    *   Locate cells containing course codes (like "EH(IT-606)", "EC(EE-501)", "DBMS(IT-505)", etc.). These are the events to extract.
    *   **Crucially, EXCLUDE cells containing only single letters ("L", "U", "N", "C", "H").** These represent breaks or non-event periods. Specifically, the "L" in the "1-2PM" column represents Lunch and MUST NOT be extracted as an event.

2.  **Extract Details for Each Event:**
    *   **\`title\`**: Use the full course code found in the cell as the event title (e.g., "EH(IT-606)").
    *   **\`startTime\` and \`endTime\`**:
        *   Determine the **Date**: Use the row label (MON, TUES, etc.) and the following reference date mapping (Assume **April 29, 2025 is the Tuesday** of the week shown):
            *   MON = 2025-04-28
            *   TUES = 2025-04-29
            *   WED = 2025-04-30
            *   THUS = 2025-05-01
            *   FRI = 2025-05-02
        *   Determine the **Time**: Use the column header corresponding to the event's cell. Map these headers precisely to 24-hour format start and end times:
            *   "10-11AM" -> Start: 10:00, End: 11:00
            *   "11-12PM" -> Start: 11:00, End: 12:00
            *   "12-1PM"  -> Start: 12:00, End: 13:00
            *   "1-2PM"   -> (LUNCH - Ignore events in this column)
            *   "2-3PM"   -> Start: 14:00, End: 15:00
        *   **Combine Date and Time**: Create the full start and end datetime strings.
        *   **Format**: Convert the combined date and time to **ISO 8601 UTC format**, ending with 'Z'. Example: Monday 10:00 AM becomes "2025-04-28T10:00:00Z".

    *   **\`description\`**: Leave as \`undefined\` or \`null\`. There are no additional details like room numbers or instructors in this specific timetable image.

3.  **Output Format:**
    *   Return a valid JSON array containing event objects.
    *   Each object must have \`title\`, \`startTime\`, and \`endTime\` keys with correctly formatted values as specified above.
    *   If no valid course events are found in the image, return an empty JSON array \`[]\`.

**Important:**
*   Pay close attention to the exact time slot mappings (10-11AM is 10:00 to 11:00, etc.).
*   Ensure all output times are in UTC (ending with 'Z').
*   Do not extract the lunch break ("L" cells) or any other single-letter cells.
*   If the image is unclear or contains no discernible course events, return an empty JSON array \`[]\`.
*   Do not invent information. Only extract what is present.

**Example Extraction (based on the reference dates):**
*   Input Cell: MON row, 10-11AM column, content "EH(IT-606)"
*   Output Object:
    \`\`\`json
    {
      "title": "EH(IT-606)",
      "startTime": "2025-04-28T10:00:00Z",
      "endTime": "2025-04-28T11:00:00Z"
    }
    \`\`\`

Now, analyze the following timetable image and provide the JSON output:
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

  // Extra validation: Ensure the output is actually an array.
  if (!Array.isArray(output)) {
    console.warn("AI output was not an array. Returning empty array. Output:", output);
    return [];
  }

   // Optional: Add validation for individual event structures within the array if needed
   const validatedOutput = output.filter(event =>
       event && typeof event.title === 'string' && typeof event.startTime === 'string' && typeof event.endTime === 'string'
   );

   if (validatedOutput.length !== output.length) {
       console.warn("Some extracted events had invalid structure and were filtered out.");
   }


  return validatedOutput;
});

