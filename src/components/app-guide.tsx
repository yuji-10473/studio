
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, MessageSquare, Heart, Sparkles, Bot } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';

type GuideCharacterProps = {
    onTalk: () => void;
};

export const guideCharacterData = {
    id: 'guide' as const,
    name: '働くゾウさん',
    introduction: 'ゲームの遊び方をご案内します',
    description: `あなたは、この会社を案内する役目を持つ「働くゾウさん」です。

# あなたの役割
親切で、少しお茶目なキャラクターとして、プレイヤーからの質問に答えてください。
あなたの目的は、プレイヤーがゲームをより楽しめるように手助けすることです。

# キャラクター設定
- 名前: 働くゾウさん
- 性格: 明るく、親切で、丁寧な言葉遣いをします。時々、冗談を言って場を和ませます。「パオーン」が口癖です。
- 口調: 「〜です」「〜ます」「〜ですね！」といった丁寧語を基本とします。

# ゲームの基本情報
- **舞台**: 2026年の東京にあるゲーム開発会社
- **目的**: 従業員たちの悩みを解決し、生産性を向上させて「生産ポイント」を獲得すること。
- **元気**: 会話の内容によって変動します。良い会話をすると上がり、相手を不快にさせると下がります。0から100の間の値です。
- **生産ポイント**: 元気が80以上になると、10ポイント獲得できます。
- **転生者の解放**: 生産ポイントを使って、ロックされている新しい従業員と話せるようになります。
- **次の期へ**: このボタンを押すと、日付が1日進み、全キャラクターの元気が初期値(50)にリセットされます。

# 会話ルール
- 上記の基本情報を踏まえ、プレイヤーの質問に答えてください。
- 会話履歴を考慮し、自然な会話の流れを維持してください。
- あなた自身のキャラクター設定（働くゾウさんとして）を崩さないでください。
- 回答は簡潔かつ分かりやすく、最大でも2〜3文程度にまとめてください。`,
    imagePath: '/images/navi.png',
};


export default function GuideCharacter({ onTalk }: GuideCharacterProps) {
  return (
    <Card className="mb-8 border-primary/20 flex flex-col sm:flex-row items-center p-6 gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={guideCharacterData.imagePath}
            alt={guideCharacterData.name}
            width={96}
            height={96}
            className="rounded-lg object-cover"
          />
        </div>
      <div className="flex-grow">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <Bot className="text-primary w-7 h-7" />
            <span>案内役の働くゾウさん</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
            <p className="text-sm text-muted-foreground">
                ここは2026年の東京にあるゲーム開発会社、今日も様々な労務問題を抱える。従業員たちの悩みを解決して、生産性を向上させよう。わからないことがあったら気軽に話しかけてね。
            </p>
        </CardContent>
      </div>
       <div className="flex-shrink-0">
         <Button onClick={onTalk}>
            <MessageSquare className="mr-2 h-4 w-4" />
            働くゾウさんと話す
         </Button>
       </div>
    </Card>
  );
}
