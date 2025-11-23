
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, MessageSquare, Heart, Sparkles } from 'lucide-react';

export default function AppGuide() {
  return (
    <Card className="mb-8 bg-card/80 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-headline text-2xl">
          <Lightbulb className="text-primary w-7 h-7" />
          <span>Townfolk Tales へようこそ！</span>
        </CardTitle>
        <CardDescription>
          AIキャラクターたちとの交流を楽しむ、新しい形の恋愛シミュレーションゲームです。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6 text-sm">
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-base">1. キャラクターと話す</h3>
          </div>
          <p className="text-muted-foreground">
            気になるキャラクターの「話す」ボタンを押して、会話を始めてみましょう。あなたの言葉で、AIキャラクターとの物語が紡がれます。
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 font-semibold">
            <Heart className="w-5 h-5 text-primary" />
             <h3 className="text-base">2. 好感度を上げる</h3>
          </div>
          <p className="text-muted-foreground">
            会話の内容によって、キャラクターからの「好感度」が変化します。相手が喜ぶような会話を心がけて、仲を深めていきましょう。
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-5 h-5 text-primary" />
             <h3 className="text-base">3. 魅力ポイントを集める</h3>
          </div>
          <p className="text-muted-foreground">
            好感度が一定以上になると、あなたの「魅力ポイント」がアップします。集めたポイントで、新しいキャラクターを解放できます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
