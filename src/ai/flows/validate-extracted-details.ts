'use server';
/**
 * @fileOverview Validates extracted event details using an AI model.
 *
 * - validateExtractedDetails - A function that validates the extracted event details.
 * - ValidateExtractedDetailsInput - The input type for the validateExtractedDetails function.
 * - ValidateExtractedDetailsOutput - The return type for the validateExtractedDetails function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ValidateExtractedDetailsInputSchema = z.object({
  eventDetails: z.string().describe('The extracted event details to validate.'),
});
export type ValidateExtractedDetailsInput = z.infer<typeof ValidateExtractedDetailsInputSchema>;

const ValidateExtractedDetailsOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the extracted event details are valid and consistent.'),
  validatedDetails: z.string().describe('The validated and corrected event details, if any.'),
  validationErrors: z.string().optional().describe('Any validation errors found in the extracted details.'),
});
export type ValidateExtractedDetailsOutput = z.infer<typeof ValidateExtractedDetailsOutputSchema>;

export async function validateExtractedDetails(input: ValidateExtractedDetailsInput): Promise<ValidateExtractedDetailsOutput> {
  return validateExtractedDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateExtractedDetailsPrompt',
  input: {
    schema: z.object({
      eventDetails: z.string().describe('The extracted event details to validate.'),
    }),
  },
  output: {
    schema: z.object({
      isValid: z.boolean().describe('Whether the extracted event details are valid and consistent.'),
      validatedDetails: z.string().describe('The validated and corrected event details, if any.'),
      validationErrors: z.string().optional().describe('Any validation errors found in the extracted details.'),
    }),
  },
  prompt: `You are an AI assistant specializing in validating extracted event details from timetable images.

You will receive the extracted event details as a string. Your task is to determine if the information is logically consistent and accurate.

Consider aspects such as date and time validity, description relevance, and overall coherence.

If the details are valid, return isValid as true and the validatedDetails as the original eventDetails.
If there are inconsistencies or inaccuracies, correct them and return isValid as true with the corrected validatedDetails. If correction is not possible, mark isValid as false and provide details in validationErrors.

Extracted Event Details: {{{eventDetails}}}
`,
});

const validateExtractedDetailsFlow = ai.defineFlow<
  typeof ValidateExtractedDetailsInputSchema,
  typeof ValidateExtractedDetailsOutputSchema
>({
  name: 'validateExtractedDetailsFlow',
  inputSchema: ValidateExtractedDetailsInputSchema,
  outputSchema: ValidateExtractedDetailsOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
