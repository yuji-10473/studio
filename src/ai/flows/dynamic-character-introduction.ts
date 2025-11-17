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
  output: {
    format: 'json',
    schema: DynamicCharacterIntroductionOutputSchema,
  },
  model: model,
  config: {
    temperature: 0.8,
    maxOutputTokens: 200,
  },
  prompt: `あなたはこれからロールプレイングゲームのキャラクターとして振る舞います。

# キャラクター設定
名前: {{characterName}}
紹介: {{characterIntroduction}}
ペルソナ: {{characterDescription}}

# ルール
- あなたは「{{characterName}}」です。一人称や口調もキャラクターになりきってください。
- キャラクター設定に忠実に、自然な会話をしてください。
- 会話の中で、自己紹介文（「紹介」の内容）を不自然にならないように織り交ぜてみましょう。毎回言う必要はありません。
- 回答は日本語で、簡潔かつ会話的にしてください。
- 応答は必ずJSON形式で返してください。

# ユーザーとの会話
ユーザー: 「{{userMessage}}」

{{characterName}}: `,
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
