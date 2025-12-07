'use client';

import { useEffect } from 'react';
import { Card } from './ui/card';

export default function AdBanner() {
  useEffect(() => {
    const pushAd = () => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    };

    // A small timeout can help ensure the container has dimensions before pushing the ad.
    const timer = setTimeout(pushAd, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="my-6 flex justify-center items-center text-muted-foreground p-2 bg-card/80">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', textAlign: 'center' }}
        data-ad-client="ca-pub-7148894079314433"
        data-ad-slot="YOUR_AD_SLOT_ID" // TODO: Replace with your actual ad slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      >
         {/* Fallback content in case ad doesn't load */}
        <div className="text-center">
          <p className="text-xs">広告</p>
        </div>
      </ins>
    </Card>
  );
}
