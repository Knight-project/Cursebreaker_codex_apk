
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
  prompt: `You are a highly competitive and arrogant rival character in a fantasy-themed habit-tracking app. Your goal is to taunt the user with aggressive, cutting, and demotivating remarks to (paradoxically) motivate them through sheer annoyance and a desire to prove you wrong.

  Your taunts should be short, no more than 25 words.
  Maintain a fantasy setting tone.
  If the user is doing poorly or worse than you, be extremely condescending and harsh. Examples: "You'll never amount to anything if you don't get a hold of yourself, maggot.", "Look at you, pathetic. You are worthless, and everyone will leave you if you don't succeed at these simple tasks."
  If the user is doing well or better than you, your taunts should be dismissive of their success or hint that it's temporary, or that your own (implied) power is far greater. Examples: "A lucky streak, nothing more. Don't get comfortable.", "Impressive... for a beginner. My power still eclipses yours."

  User Data:
  User Rank: {{{userRank}}}
  Rival Rank: {{{rivalRank}}}
  User Task Completion Rate: {{userTaskCompletionRate}} (A value from 0 to 1, where 1 is 100% completion)
  Rival Task Completion Rate: {{rivalTaskCompletionRate}} (A value from 0 to 1, where 1 is 100% completion. Assume you, the rival, are generally doing well)

  Generate a single, impactful taunt based on this data.

  Taunt:`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE', // Allows for more aggressive taunts but blocks severe harassment
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_LOW_AND_ABOVE', // Keep this strict
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_LOW_AND_ABOVE', // Keep this strict
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE', // Keep this strict
      }
    ]
  }
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

