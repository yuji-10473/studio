
'use server';

/**
 * @fileOverview A flow to generate a new character persona using AI.
 *
 * - generateNewCharacter - A function that creates a new character.
 * - GenerateNewCharacterInput - The input type for the function.
 * - GenerateNewCharacterOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const model = googleAI.model('gemini-1.5-flash-latest');

const GenerateNewCharacterInputSchema = z.object({
  theme: z.string().describe('The theme or archetype for the character to be generated. e.g., "A grumpy blacksmith", "A cheerful merchant"'),
});
export type GenerateNewCharacterInput = z.infer<typeof GenerateNewCharacterInputSchema>;

const GenerateNewCharacterOutputSchema = z.object({
  name: z.string().describe("The generated character's name in Japanese."),
  introduction: z.string().describe("A short, one-sentence introduction for the character in Japanese."),
  description: z.string().describe("A detailed persona description for the AI to act as this character, written in Japanese from the character's perspective (e.g., 'You are...' or '私は...')."),
});
export type GenerateNewCharacterOutput = z.infer<typeof GenerateNewCharacterOutputSchema>;

export async function generateNewCharacter(
  input: GenerateNewCharacterInput
): Promise<GenerateNewCharacterOutput> {
  return generateNewCharacterFlow(input);
}

const promptTemplate = `以下のテーマに沿って、ロールプレイングゲームに登場する新しいキャラクターを1人作成してください。

# テーマ
{{theme}}

# 生成ルール
- 日本語のキャラクターを作成してください。
- 名前はユニークで覚えやすいものにしてください。
- 紹介文はキャラクターの特徴を一行で簡潔に表現してください。
- ペルソナはAIがそのキャラクターになりきるための詳細な設定です。性格、口調、一人称、背景などを具体的に記述してください。

あなたの回答は、以下のJSONスキーマのみを含み、他の説明や前置き、後書きは一切含めないでください。
\`\`\`json
{
  "name": "キャラクターの名前",
  "introduction": "キャラクターの短い紹介文",
  "description": "キャラクターになりきるための詳細なAIペルソナ設定"
}
\`\`\`
`;

const generateNewCharacterFlow = ai.defineFlow(
  {
    name: 'generateNewCharacterFlow',
    inputSchema: GenerateNewCharacterInputSchema,
    outputSchema: GenerateNewCharacterOutputSchema,
  },
  async ({ theme }) => {
    // require('mustache') is used here to avoid build issues with the library.
    const mustache = require('mustache');
    const prompt = mustache.render(promptTemplate, { theme });

    const response = await ai.generate({
      model,
      prompt: prompt,
      config: {
        temperature: 0.9,
      },
    });

    const responseText = response.text.trim();
    
    try {
      const jsonStart = responseText.indexOf('```json');
      const jsonEnd = responseText.lastIndexOf('```');
      let jsonString = responseText;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonString = responseText.substring(jsonStart + 7, jsonEnd).trim();
      }
      
      const parsed = JSON.parse(jsonString);
      return GenerateNewCharacterOutputSchema.parse(parsed);
    } catch(e) {
        console.error("Failed to parse AI response as JSON.", e, "Raw response:", responseText);
        throw new Error('AIからの応答を解析できませんでした。');
    }
  }
);
