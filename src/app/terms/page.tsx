import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">利用規約</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>この利用規約（以下，「本規約」といいます。）は、Townfolk Tales 運営事務局（以下，「当方」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。</p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第1条（適用）</h2>
            <p>本規約は，ユーザーと当方との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第2条（禁止事項）</h2>
            <p>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正な目的を持って本サービスを利用する行為</li>
                <li>本サービスの他のユーザーまたはその他の第三者に不利益，損害，不快感を与える行為</li>
                <li>その他，当方が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第3条（免責事項）</h2>
            <p>当方は，本サービスに事実上または法律上の瑕疵（安全性，信頼性，正確性，完全性，有効性，特定の目的への適合性，セキュリティなどに関する欠陥，エラーやバグ，権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。当方は，本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第4条（利用規約の変更）</h2>
            <p>当方は，必要と判断した場合には，ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
          </section>

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
