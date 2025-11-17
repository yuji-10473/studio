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
import {googleAI} from '@genkit-ai/google-genai';

// Per AI_Rules.md, we must use gemini-2.5-flash.
const model = googleAI.model('gemini-2.5-flash');

const DynamicCharacterIntroductionInputSchema = z.object({
  characterName: z.string().describe('The name of the character to talk to.'),
  characterIntroduction: z
    .string()
    .describe('The introduction of the character.'),
  userMessage: z.string().describe('The message from the user.'),
});
export type DynamicCharacterIntroductionInput = z.infer<
  typeof DynamicCharacterIntroductionInputSchema
>;

const DynamicCharacterIntroductionOutputSchema = z.object({
  aiResponse: z.string().describe('The AI character response.'),
  prompt: z.string().describe('The full prompt sent to the AI.'),
});
export type DynamicCharacterIntroductionOutput = z.infer<
  typeof DynamicCharacterIntroductionOutputSchema
>;

export async function dynamicCharacterIntroduction(
  input: DynamicCharacterIntroductionInput
): Promise<DynamicCharacterIntroductionOutput> {
  return dynamicCharacterIntroductionFlow(input);
}

const PROMPT_TEMPLATE = `あなたはこれからロールプレイングゲームのキャラクターとして振る舞います。

# キャラクター設定
名前: {{characterName}}
紹介: {{characterIntroduction}}

# ルール
- あなたは「{{characterName}}」です。一人称や口調もキャラクターになりきってください。
- キャラクター設定に忠実に、自然な会話をしてください。
- 回答は日本語で、簡潔かつ会話的にしてください。
`;

const dynamicCharacterIntroductionFlow = ai.defineFlow(
  {
    name: 'dynamicCharacterIntroductionFlow',
    inputSchema: DynamicCharacterIntroductionInputSchema,
    outputSchema: DynamicCharacterIntroductionOutputSchema,
  },
  async input => {
    const systemPrompt = require('mustache').render(PROMPT_TEMPLATE, {
        characterName: input.characterName,
        characterIntroduction: input.characterIntroduction,
    });
    
    const response = await ai.generate({
      model,
      messages: [
        {role: 'system', content: [{text: systemPrompt}]},
        {role: 'user', content: [{text: input.userMessage}]},
      ],
      config: {
        temperature: 0.8,
        maxOutputTokens: 200,
      },
    });

    const aiResponse = response.text;
    const fullPromptForLog = `[SYSTEM]\n${systemPrompt}\n\n[USER]\n${input.userMessage}`;

    return {
      aiResponse,
      prompt: fullPromptForLog,
    };
  }
);
