
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto py-4 px-4 md:px-8">
        <div className="flex flex-col sm:flex-row justify-center items-center text-sm text-muted-foreground">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/about" className="hover:text-foreground transition-colors">
              このサイトについて
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              運営者情報
            </Link>
          </nav>
          <p className="mt-4 sm:mt-0 sm:ml-4 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 border-muted">
            &copy; {new Date().getFullYear()} Townfolk Tales
          </p>
          <span className="mt-2 sm:mt-0 sm:ml-4">Ver 0.9.7</span>
        </div>
      </div>
    </footer>
  );
}
