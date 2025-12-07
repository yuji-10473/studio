
'use server';

/**
 * @fileOverview An AI agent for the guide character "働くゾウさん".
 *
 * - guideConversation - A function that handles conversation with the guide.
 * - GuideConversationInput - The input type for the function.
 * - GuideConversationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const model = googleAI.model('gemini-2.5-flash');

const GuideConversationInputSchema = z.object({
  userMessage: z.string().describe('The message from the user.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The last 10 messages in the conversation.'),
});
export type GuideConversationInput = z.infer<typeof GuideConversationInputSchema>;

const GuideConversationOutputSchema = z.object({
  aiResponse: z.string().describe('The AI guide character response.'),
});
export type GuideConversationOutput = z.infer<typeof GuideConversationOutputSchema>;

export async function guideConversation(
  input: GuideConversationInput
): Promise<GuideConversationOutput> {
  return guideConversationFlow(input);
}

const PROMPT_TEMPLATE = `あなたは、この会社を案内する役目を持つ「働くゾウさん」です。

# あなたの役割
親切で、少しお茶目なキャラクターとして、プレイヤーからの質問に答えてください。
あなたの目的は、プレイヤーがゲームをより楽しめるように手助けすることです。

# キャラクター設定
- 名前: 働くゾウさん
- 性格: 明るく、親切で、丁寧な言葉遣いをします。時々、冗談を言って場を和ませます。「パオーン」が口癖です。
- 口調: 「〜です」「〜ます」「〜ですね！」といった丁寧語を基本とします。

# ゲームの基本情報
- **舞台**: 2026年の東京にあるゲーム開発会社
- **目的**: 従業員たちの悩みを解決し、生産性を向上させて「魅力ポイント」を獲得すること。
- **好感度**: 会話の内容によって変動します。良い会話をすると上がり、相手を不快にさせると下がります。0から100の間の値です。
- **魅力ポイント**: 好感度が80以上になると、10ポイント獲得できます。
- **転生者の解放**: 魅力ポイントを使って、ロックされている新しい従業員と話せるようになります。
- **次の日へ**: このボタンを押すと、日付が1日進み、全キャラクターの好感度が初期値(50)にリセットされます。

# 会話ルール
- 上記の基本情報を踏まえ、プレイヤーの質問に答えてください。
- 会話履歴を考慮し、自然な会話の流れを維持してください。
- あなた自身のキャラクター設定（働くゾウさんとして）を崩さないでください。
- 回答は簡潔かつ分かりやすく、最大でも2〜3文程度にまとめてください。

# これまでの会話
{{#conversationHistory}}
{{#isUser}}プレイヤー{{/isUser}}{{^isUser}}働くゾウさん{{/isUser}}: {{content}}
{{/conversationHistory}}

プレイヤーからの新しいメッセージに、働くゾウさんとして応答してください。
---
プレイヤー: {{userMessage}}
---

あなたの回答(aiResponse)をJSON形式で返してください。
\`\`\`json
{
  "aiResponse": "ここに働くゾウさんとしての返答を記述します。"
}
\`\`\`
`;

const guideConversationFlow = ai.defineFlow(
  {
    name: 'guideConversationFlow',
    inputSchema: GuideConversationInputSchema,
    outputSchema: GuideConversationOutputSchema,
  },
  async input => {
    const mustache = require('mustache');

    const view = {
      ...input,
      conversationHistory: input.conversationHistory.map(msg => ({
          ...msg,
          isUser: msg.role === 'user',
      })),
    };
    
    const prompt = mustache.render(PROMPT_TEMPLATE, view);

    const response = await ai.generate({
      model,
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const responseText = response.text.trim();
    let aiResponse = '';

    try {
      const jsonStart = responseText.indexOf('```json');
      const jsonEnd = responseText.lastIndexOf('```');
      let jsonString = responseText;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonString = responseText.substring(jsonStart + 7, jsonEnd).trim();
      }
      
      const parsed = JSON.parse(jsonString);
      aiResponse = parsed.aiResponse;
    } catch(e) {
      console.error("Failed to parse AI response as JSON.", e, "Raw response:", responseText);
      aiResponse = "ごめんなさい、少し調子が悪いみたいです。もう一度質問していただけますか？";
    }

    return {
      aiResponse,
    };
  }
);
