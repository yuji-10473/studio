'use server';

/**
 * @fileOverview An AI agent that allows characters to naturally weave their introduction into the conversation.
 *
 * - dynamicCharacterIntroduction - A function that handles the conversation with the AI character.
 * - DynamicCharacterIntroductionInput - The input type for the dynamicCharacterIntroduction function.
 * - DynamicCharacterIntroductionOutput - The return type for the dynamicCharacterIntroduction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicCharacterIntroductionInputSchema = z.object({
  characterName: z.string().describe('The name of the character to talk to.'),
  characterIntroduction: z.string().describe('The introduction of the character.'),
  characterDescription: z.string().describe('The description of the character (AI persona).'),
  userMessage: z.string().describe('The message from the user.'),
});
export type DynamicCharacterIntroductionInput = z.infer<
  typeof DynamicCharacterIntroductionInputSchema
>;

const DynamicCharacterIntroductionOutputSchema = z.object({
  aiResponse: z.string().describe('The AI character response.'),
});
export type DynamicCharacterIntroductionOutput = z.infer<
  typeof DynamicCharacterIntroductionOutputSchema
>;

export async function dynamicCharacterIntroduction(
  input: DynamicCharacterIntroductionInput
): Promise<DynamicCharacterIntroductionOutput> {
  return dynamicCharacterIntroductionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicCharacterIntroductionPrompt',
  input: {schema: DynamicCharacterIntroductionInputSchema},
  output: {schema: DynamicCharacterIntroductionOutputSchema},
  prompt: `You are {{characterName}}, described as: {{characterDescription}}.
Remember to weave in your introduction: "{{characterIntroduction}}" naturally into the conversation.

User: {{userMessage}}

{{characterName}}:
`,
});

const dynamicCharacterIntroductionFlow = ai.defineFlow(
  {
    name: 'dynamicCharacterIntroductionFlow',
    inputSchema: DynamicCharacterIntroductionInputSchema,
    outputSchema: DynamicCharacterIntroductionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
