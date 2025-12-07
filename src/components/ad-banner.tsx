'use client';

import { useEffect } from 'react';
import { Card } from './ui/card';

export default function AdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <Card className="my-8 flex justify-center items-center text-muted-foreground p-4 min-h-[100px] bg-card/80">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7148894079314433"
        data-ad-slot="YOUR_AD_SLOT_ID" // TODO: Replace with your actual ad slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
       {/* Fallback content */}
      <div className="text-center">
        <p className="text-sm">広告</p>
      </div>
    </Card>
  );
}
