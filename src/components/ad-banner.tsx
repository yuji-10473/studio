'use client';

export default function AdBanner() {
  return (
    <div className="my-4 w-full h-[45px] bg-card/60 rounded-lg border border-border flex justify-center items-center">
      {/* Fallback content in case ad doesn't load */}
      <div className="text-center text-muted-foreground">
        <p className="text-xs">広告</p>
      </div>
    </div>
  );
}
