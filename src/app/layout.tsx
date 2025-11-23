
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Footer from '@/components/footer';
import { GameStateProvider } from '@/contexts/game-state';

export const metadata: Metadata = {
  title: 'Townfolk Tales',
  description: 'An interactive RPG where you converse with AI characters.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="google-adsense-account" content="ca-pub-7148894079314433" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Literata:opsz,wght@24..144,400;700&display=swap" rel="stylesheet" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7148894079314433"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <GameStateProvider>
            <main className="flex-grow">{children}</main>
            <Footer />
          </GameStateProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
