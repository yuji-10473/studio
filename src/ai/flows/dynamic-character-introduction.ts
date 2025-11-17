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
import type { Message } from '@/lib/types';

// Per AI_Rules.md, we must use gemini-2.5-flash.
const model = googleAI.model('gemini-2.5-flash');

const DynamicCharacterIntroductionInputSchema = z.object({
  characterName: z.string().describe('The name of the character to talk to.'),
  characterIntroduction: z
    .string()
    .describe('The introduction of the character.'),
  userMessage: z.string().describe('The message from the user.'),
  conversationHistory: z.array(z.any()).describe('The last 10 messages in the conversation.'),
});
export type DynamicCharacterIntroductionInput = z.infer<
  typeof DynamicCharacterIntroductionInputSchema
>;

const DynamicCharacterIntroductionOutputSchema = z.object({
  aiResponse: z.string().describe('The AI character response.'),
  prompt: z.string().describe('The full prompt sent to the AI.'),
  rawResponse: z.any().describe('The raw response from the AI model.'),
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
- 以下の会話履歴の続きを自然に生成してください。

{{#conversationHistory.length}}
# これまでの会話
{{#conversationHistory}}
{{#isUser}}ユーザー{{/isUser}}{{^isUser}}{{characterName}}{{/isUser}}: {{text}}
{{/conversationHistory}}
{{/conversationHistory.length}}

上記の設定になりきって、以下のユーザーからのメッセージに応答してください。

---
ユーザー: {{userMessage}}
---

{{characterName}}:
`;

const dynamicCharacterIntroductionFlow = ai.defineFlow(
  {
    name: 'dynamicCharacterIntroductionFlow',
    inputSchema: DynamicCharacterIntroductionInputSchema,
    outputSchema: DynamicCharacterIntroductionOutputSchema,
  },
  async input => {
    // require('mustache') is used here to avoid build issues with the library.
    const mustache = require('mustache');

    const view = {
        ...input,
        conversationHistory: input.conversationHistory.map(msg => ({
            ...msg,
            isUser: msg.sender === 'user',
        })),
        // A helper function for mustache to check if the history has items
        "conversationHistory.length": input.conversationHistory.length > 0,
    };
    
    const prompt = mustache.render(PROMPT_TEMPLATE, view);

    const response = await ai.generate({
      model,
      prompt: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 2000,
      },
    });

    const aiResponse = response.text;

    return {
      aiResponse,
      prompt: prompt,
      rawResponse: response,
    };
  }
);
