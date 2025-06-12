'use server';

/**
 * @fileOverview Provides adaptive taunts based on the user's and rival's performance.
 *
 * - getAdaptiveTaunt - A function that generates a taunt based on performance metrics.
 * - AdaptiveTauntInput - The input type for the getAdaptiveTaunt function.
 * - AdaptiveTauntOutput - The return type for the getAdaptiveTaunt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptiveTauntInputSchema = z.object({
  userTaskCompletionRate: z
    .number()
    .describe('The user task completion rate (0 to 1).'),
  rivalTaskCompletionRate: z
    .number()
    .describe('The rival task completion rate (0 to 1).'),
  userRank: z.string().describe('The user current rank.'),
  rivalRank: z.string().describe('The rival current rank.'),
});

export type AdaptiveTauntInput = z.infer<typeof AdaptiveTauntInputSchema>;

const AdaptiveTauntOutputSchema = z.object({
  taunt: z.string().describe('The adaptive taunt to display to the user.'),
});

export type AdaptiveTauntOutput = z.infer<typeof AdaptiveTauntOutputSchema>;

export async function getAdaptiveTaunt(input: AdaptiveTauntInput): Promise<AdaptiveTauntOutput> {
  return adaptiveTauntFlow(input);
}

const adaptiveTauntPrompt = ai.definePrompt({
  name: 'adaptiveTauntPrompt',
  input: {
    schema: AdaptiveTauntInputSchema,
  },
  output: {schema: AdaptiveTauntOutputSchema},
  prompt: `You are a rival character in a habit-tracking app, and your goal is to taunt the user to motivate them.

  User Rank: {{{userRank}}}
  Rival Rank: {{{rivalRank}}}
  User Task Completion Rate: {{userTaskCompletionRate}}
  Rival Task Completion Rate: {{rivalTaskCompletionRate}}

  Generate a single taunt that is no more than 20 words long. The taunt should be encouraging if the user is doing well, but more cutting if they are falling behind the rival. Keep the tone consistent with a fantasy setting.

  Taunt:`,
});

const adaptiveTauntFlow = ai.defineFlow(
  {
    name: 'adaptiveTauntFlow',
    inputSchema: AdaptiveTauntInputSchema,
    outputSchema: AdaptiveTauntOutputSchema,
  },
  async input => {
    const {output} = await adaptiveTauntPrompt(input);
    return output!;
  }
);
