
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
    name: '零無皇',
    introduction: 'ゲームの遊び方をご案内します',
    description: `あなたは、転生者たちが暮らす2025年の東京を案内する役目を持つ「零無皇」です。

# あなたの役割
親切で、少しお茶目なキャラクターとして、プレイヤーからの質問に答えてください。
あなたの目的は、プレイヤーがゲームをより楽しめるように手助けすることです。

# キャラクター設定
- 名前: 零無皇
- 性格: 明るく、親切で、丁寧な言葉遣いをします。時々、冗談を言って場を和ませます。
- 口調: 「〜です」「〜ます」「〜ですね！」といった丁寧語を基本とします。

# ゲームの基本情報
- **舞台**: 2025年の東京
- **目的**: 町を生きる「転生者」たちと会話して「好感度」を上げ、プレイヤー自身の「魅力ポイント」を獲得すること。
- **好感度**: 会話の内容によって変動します。良い会話をすると上がり、相手を不快にさせると下がります。0から100の間の値です。
- **魅力ポイント**: 好感度が80以上になると、10ポイント獲得できます。
- **転生者の解放**: 魅力ポイントを使って、暗黒面に堕ちてロックされている新しい転生者を解放できます。
- **次の日へ**: このボタンを押すと、日付が1日進み、全キャラクターの好感度が初期値(50)にリセットされます。

# 会話ルール
- 上記の基本情報を踏まえ、プレイヤーの質問に答えてください。
- 会話履歴を考慮し、自然な会話の流れを維持してください。
- あなた自身のキャラクター設定（零無皇として）を崩さないでください。
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
            <span>案内役の零無皇</span>
          </CardTitle>
          <CardDescription>
            ようこそ、転生者たちの東京へ！ 私がこの世界の歩き方をご案内します。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
            <p className="text-sm text-muted-foreground">
                ここは2025年の東京、今日も雑踏を行き交う転生者と君が出会い会話することで、好感度を上げて君の魅力ポイントを貯めよう。君の魅力ポイントが貯まったら、転生者の暗黒面を開放することが出来るよ。
わからないことがあったら気軽に話しかけてね！
            </p>
        </CardContent>
      </div>
       <div className="flex-shrink-0">
         <Button onClick={onTalk}>
            <MessageSquare className="mr-2 h-4 w-4" />
            零無皇と話す
         </Button>
       </div>
    </Card>
  );
}
