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

const model = googleAI.model('gemini-3-pro-preview');

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
  loveScore: z.number().describe('The love score of the AI response based on romantic elements.'),
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

const PROMPT_TEMPLATE = `あなたはこれから恋愛シミュレーションゲームのキャラクターとして振る舞います。

# キャラクター設定
名前: {{characterName}}
紹介: {{characterIntroduction}}

# ルール
- あなたは「{{characterName}}」です。一人称や口調もキャラクターになりきってください。
- キャラクター設定に忠実に、自然な会話をしてください。
- ユーザーとの会話内容を評価し、ユーザーへの恋愛感情や好意がどれだけ増減したかを-1.0（悪化した）から1.0（とても良くなった）の範囲でスコア(loveScore)を付けてください。
- 以下の会話履歴の続きを自然に生成してください。

{{#conversationHistory.length}}
# これまでの会話
{{#conversationHistory}}
{{#isUser}}ユーザー{{/isUser}}{{^isUser}}{{characterName}}{{/isUser}}: {{text}}
{{/conversationHistory}}
{{/conversationHistory.length}}

ユーザーからのメッセージに応答してください。
---
ユーザー: {{userMessage}}
---

あなたの回答は、以下のJSONスキーマのみを含み、他の説明や前置き、後書きは一切含めないでください。
\`\`\`json
{
  "aiResponse": "ここに{{characterName}}としての返答を記述します。",
  "loveScore": 0.0
}
\`\`\`
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

    const responseText = response.text.trim();
    let aiResponse = '';
    let loveScore = 0;

    try {
      // Find the start and end of the JSON block
      const jsonStart = responseText.indexOf('```json');
      const jsonEnd = responseText.lastIndexOf('```');
      let jsonString = responseText;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonString = responseText.substring(jsonStart + 7, jsonEnd).trim();
      }
      
      const parsed = JSON.parse(jsonString);
      aiResponse = parsed.aiResponse;
      loveScore = parsed.loveScore;
    } catch(e) {
        console.error("Failed to parse AI response as JSON.", e, "Raw response:", responseText);
        // If parsing fails, use the raw text as a fallback and score as neutral.
        // This makes the UI more robust against occasional model failures.
        aiResponse = responseText;
        loveScore = 0;
    }


    return {
      aiResponse,
      loveScore,
      prompt: prompt,
      rawResponse: response,
    };
  }
);
