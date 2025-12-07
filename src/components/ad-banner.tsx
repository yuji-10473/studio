'use client';

export default function AdBanner() {
  return (
    <div className="my-4 w-full h-[45px] bg-card/60 rounded-lg border border-border flex justify-center items-center">
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSfWam1d54AoHKXY8PsPKZJmi6zhl9D9OXOG6objyPFI46Arxg/viewform?usp=header"
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-foreground hover:underline"
      >
        Slack参加申請
      </a>
    </div>
  );
}
