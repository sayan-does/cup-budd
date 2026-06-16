import { useEffect, useRef, useState } from 'react';

interface StatsBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  homeLabel?: string;
  awayLabel?: string;
}

function StatsBar({ label, homeValue, awayValue, homeLabel, awayLabel }: StatsBarProps) {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="px-gutter py-3">
      <p className="font-section-label text-on-surface text-center mb-2 uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-10 text-right text-caption font-bold text-on-surface tabular-nums">
          {homeLabel ?? homeValue}
        </span>
        <div className="flex-1 h-3 brutalist-border bg-surface-variant overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: animated ? `${homePct}%` : '0%' }}
          />
        </div>
        <div className="flex-1 h-3 brutalist-border bg-surface-variant overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-700"
            style={{ width: animated ? `${100 - homePct}%` : '0%' }}
          />
        </div>
        <span className="w-10 text-left text-caption font-bold text-on-surface tabular-nums">
          {awayLabel ?? awayValue}
        </span>
      </div>
    </div>
  );
}

export default StatsBar;
