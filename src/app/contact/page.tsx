import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">運営者情報 / お問い合わせ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">運営者</h2>
            <p className="text-muted-foreground">
              Townfolk Tales 運営事務局
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">お問い合わせ</h2>
            <p className="text-muted-foreground mb-4">
              ご意見、ご感想、不具合のご報告などがございましたら、以下のメールアドレスまでご連絡ください。
            </p>
            <Button asChild variant="outline">
              <a href="mailto:contact@example.com">
                <Mail className="mr-2 h-4 w-4" />
                contact@example.com
              </a>
            </Button>
            <p className="text-sm text-muted-foreground mt-2">※ 上記はダミーのメールアドレスです。実際の連絡先にご変更ください。</p>
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
