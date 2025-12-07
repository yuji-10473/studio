
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
import type { Message, UserProfile } from '@/lib/types';

const model = googleAI.model('gemini-2.5-flash');

const DynamicCharacterIntroductionInputSchema = z.object({
  characterName: z.string().describe('The name of the character to talk to.'),
  characterIntroduction: z
    .string()
    .describe('The introduction of the character.'),
  userMessage: z.string().describe('The message from the user.'),
  conversationHistory: z.array(z.any()).describe('The last 10 messages in the conversation.'),
  userProfile: z.custom<UserProfile>().describe('The profile of the user.'),
});
export type DynamicCharacterIntroductionInput = z.infer<
  typeof DynamicCharacterIntroductionInputSchema
>;

const DynamicCharacterIntroductionOutputSchema = z.object({
  aiResponse: z.string().describe('The AI character response.'),
  productivityScore: z.number().describe('The score of the AI response based on how much the user\'s message contributed to solving the character\'s problem or improving their productivity.'),
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

# あなたのキャラクター設定
名前: {{characterName}}
紹介: {{characterIntroduction}}

# 会話相手の情報
以下のJSONオブジェクトは、あなたが会話する相手のユーザー情報です。この情報（特にdisplayNameやbio）を参考にして、自然でパーソナルな会話を心がけてください。例えば、相手の名前を会話に含めたり、自己紹介の内容に触れると、より親密な雰囲気になります。
\`\`\`json
{{{userProfileJson}}}
\`\`\`

# ルール
- あなたは「{{characterName}}」です。一人称や口調もキャラクターになりきってください。
- キャラクター設定と、上記の「会話相手の情報」に忠実に、自然な会話をしてください。
- ユーザーとの会話が、あなたの抱える労務問題の解決や生産性向上にどれだけ貢献したかを評価し、-1.0（悪影響があった）から1.0（非常に貢献した）の範囲でスコア(productivityScore)を付けてください。
- 以下の会話履歴の続きを自然に生成してください。

{{#conversationHistory}}
# これまでの会話
{{#.}}
{{#isUser}}ユーザー ({{userProfile.displayName}}){{/isUser}}{{^isUser}}{{characterName}}{{/isUser}}: {{text}}
{{/.}}
{{/conversationHistory}}

ユーザーからのメッセージに応答してください。
---
ユーザー ({{userProfile.displayName}}): {{userMessage}}
---

あなたの回答は、以下のJSONスキーマのみを含み、他の説明や前置き、後書きは一切含めないでください。
\`\`\`json
{
  "aiResponse": "ここに{{characterName}}としての返答を記述します。",
  "productivityScore": 0.0
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
        userProfileJson: JSON.stringify(input.userProfile, null, 2),
        conversationHistory: input.conversationHistory.map(msg => ({
            ...msg,
            isUser: msg.sender === 'user',
        })),
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
    let productivityScore = 0;

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
      productivityScore = parsed.productivityScore;
    } catch(e) {
        console.error("Failed to parse AI response as JSON.", e, "Raw response:", responseText);
        // If parsing fails, use the raw text as a fallback and score as neutral.
        // This makes the UI more robust against occasional model failures.
        aiResponse = responseText;
        productivityScore = 0;
    }


    return {
      aiResponse,
      productivityScore,
      prompt: prompt,
      rawResponse: response,
    };
  }
);
