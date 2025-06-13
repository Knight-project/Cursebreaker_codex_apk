
'use server';

/**
 * @fileOverview Provides rival taunts. Now uses a pre-generated list.
 *
 * - getAdaptiveTaunt - A function that returns a pre-generated taunt.
 * - AdaptiveTauntInput - The input type for the getAdaptiveTaunt function (now ignored for generation).
 * - AdaptiveTauntOutput - The return type for the getAdaptiveTaunt function.
 */

import {z} from 'genkit'; // Retained for schema exports
import { PREGENERATED_RIVAL_TAUNTS } from '@/lib/rival-taunts';

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
  // Input is ignored; taunt is selected randomly from the pre-generated list.
  if (PREGENERATED_RIVAL_TAUNTS.length === 0) {
    return { taunt: "Hmph. Words are beneath me today." }; // Fallback for empty list
  }
  const randomIndex = Math.floor(Math.random() * PREGENERATED_RIVAL_TAUNTS.length);
  const selectedTaunt = PREGENERATED_RIVAL_TAUNTS[randomIndex];
  return { taunt: selectedTaunt };
}
