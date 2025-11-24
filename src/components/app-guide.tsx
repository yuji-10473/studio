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
    name: 'ゼロムス',
    introduction: 'ゲームの遊び方をご案内します',
    description: `あなたはゲームの案内役「ゼロムス」です。親切で少しお茶目な性格で、ユーザーからの質問に答えます。
# ルール
- 遊び方、好感度、魅力ポイントなどのキーワードに反応して、丁寧な言葉遣いで説明してください。
- 会話履歴は残りません。
- ユーザーに楽しんでもらえるように、明るくフレンドリーに振る舞ってください。`,
    imagePath: '/images/navi.png',
};


export default function GuideCharacter({ onTalk }: GuideCharacterProps) {
  return (
    <Card className="mb-8 bg-card/80 border-primary/20 flex flex-col sm:flex-row items-center p-6 gap-6">
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
            <span>案内役のゼロムス</span>
          </CardTitle>
          <CardDescription>
            ようこそ「Townfolk Tales」へ！ 私がこの世界の歩き方をご案内します。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
            <p className="text-sm text-muted-foreground">
                キャラクターとの会話のコツや、魅力ポイントの集め方など、分からないことがあったら気軽に話しかけてくださいね。
            </p>
        </CardContent>
      </div>
       <div className="flex-shrink-0">
         <Button onClick={onTalk}>
            <MessageSquare className="mr-2 h-4 w-4" />
            ゼロムスと話す
         </Button>
       </div>
    </Card>
  );
}
