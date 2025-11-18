import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">プライバシーポリシー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>Townfolk Tales 運営事務局（以下「当方」といいます。）は、本ウェブサイト上で提供するサービス（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。</p>
          
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第1条（個人情報）</h2>
            <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第2条（個人情報の収集方法）</h2>
            <p>本サービスでは、ユーザーが利用登録をする際に、Googleアカウントまたはメールアドレス、パスワードなどの情報をご提供いただきます。これらはFirebase Authenticationを利用して安全に管理されます。</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第3条（個人情報を収集・利用する目的）</h2>
            <p>当方が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>上記の利用目的に付随する目的</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第4条（広告について）</h2>
            <p>本サービスでは、第三者配信の広告サービス「Google AdSense」を利用しています。このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、本サービスや他サイトへのアクセスに関する情報 『Cookie』（氏名、住所、メール アドレス、電話番号は含まれません）を使用することがあります。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">第5条（プライバシーポリシーの変更）</h2>
            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。当方が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</p>
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
