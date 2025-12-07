
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">このサイト「Motivate Tales」について</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">ようこそ！</h2>
            <p className="text-muted-foreground">
              「Motivate Tales」は、AI世界に住む住人の労務問題を解決して、生産性を向上させる、新しい形のインタラクティブな体験を提供するアプリケーションです。
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">このアプリで出来ること</h2>
            <p className="text-muted-foreground">
              プログラマー、デザイナー、オペレーターなど、様々な背景を持つキャラクターたちと自由に会話できます。あなたの言葉が、彼らの機嫌やあなたへの感情を変化させ、会話の展開に影響を与えます。生産性を向上させてポイントを獲得しましょう。
            </p>
          </div>
           <div>
            <h2 className="text-lg font-semibold mb-2">技術について</h2>
            <p className="text-muted-foreground">
              このアプリケーションは、Next.js、Firebase、そしてGoogleの生成AIモデルであるGeminiといった最新のウェブ技術を活用して構築されています。キャラクターの応答はAIによってリアルタイムで生成されるため、毎回新鮮な会話が楽しめます。
            </p>
          </div>
          <div className="text-center pt-4">
            <Button asChild>
              <Link href="/">ゲームに戻る</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
