'use server';

/**
 * @fileOverview An AI persona generation flow for characters in the game.
 *
 * - generateCharacterPersona - A function that generates the character persona.
 * - GenerateCharacterPersonaInput - The input type for the generateCharacterPersona function.
 * - GenerateCharacterPersonaOutput - The return type for the generateCharacterPersona function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterPersonaInputSchema = z.object({
  name: z.string().describe('The name of the character.'),
  introduction: z.string().describe('A short introduction of the character.'),
  description: z.string().describe('The current description of the character persona.'),
  userMessage: z.string().describe('The user message to the character.'),
});
export type GenerateCharacterPersonaInput = z.infer<typeof GenerateCharacterPersonaInputSchema>;

const GenerateCharacterPersonaOutputSchema = z.object({
  response: z.string().describe('The character response to the user message.'),
});
export type GenerateCharacterPersonaOutput = z.infer<typeof GenerateCharacterPersonaOutputSchema>;

export async function generateCharacterPersona(
  input: GenerateCharacterPersonaInput
): Promise<GenerateCharacterPersonaOutput> {
  return generateCharacterPersonaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterPersonaPrompt',
  input: {schema: GenerateCharacterPersonaInputSchema},
  output: {schema: GenerateCharacterPersonaOutputSchema},
  prompt: `You are {{name}}, {{introduction}} Your description is as follows: {{description}}\n\nRespond to the following user message as {{name}}:\n\n{{userMessage}}`,
});

const generateCharacterPersonaFlow = ai.defineFlow(
  {
    name: 'generateCharacterPersonaFlow',
    inputSchema: GenerateCharacterPersonaInputSchema,
    outputSchema: GenerateCharacterPersonaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
