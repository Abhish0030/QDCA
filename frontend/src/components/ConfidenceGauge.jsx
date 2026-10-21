import { useEffect, useId, useState } from "react";

const CONFIDENCE_STYLES = {
  high: {
    label: "High",
    start: "#34d399",
    end: "#059669",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  medium: {
    label: "Moderate",
    start: "#fbbf24",
    end: "#f97316",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  low: {
    label: "Low",
    start: "#fb7185",
    end: "#e11d48",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

function normalizeScore(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

export default function ConfidenceGauge({ value }) {
  const score = normalizeScore(value);
  const [animatedScore, setAnimatedScore] = useState(0);
  const gradientId = `speedometer-${useId().replace(/:/g, "")}`;
  const level = score >= 80 ? "high" : score >= 60 ? "medium" : "low";
  const style = CONFIDENCE_STYLES[level];
  const needleAngle = -90 + animatedScore * 1.8;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedScore(score);
      return undefined;
    }

    let animationFrame;
    const startedAt = performance.now();
    const duration = 1050;

    function animate(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 4;
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [score]);

  return (
    <div
      className="relative isolate min-h-[156px] overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-purple-50/40 px-4 pb-2 pt-3.5 shadow-sm transition-colors duration-200 hover:border-purple-200"
      role="progressbar"
      aria-label="Classification confidence"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Confidence</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">AI certainty score</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-inset ${style.badge}`}>
          {style.label}
        </span>
      </div>

      <svg
        viewBox="0 0 180 108"
        className="mx-auto -mt-1 block h-[104px] w-full max-w-[210px] overflow-hidden"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={style.start} />
            <stop offset="100%" stopColor={style.end} />
          </linearGradient>
        </defs>

        <path
          d="M 24 91 A 66 66 0 0 1 156 91"
          fill="none"
          stroke="#e9edf3"
          strokeWidth="12"
          strokeLinecap="round"
          pathLength="100"
        />
        <path
          d="M 24 91 A 66 66 0 0 1 156 91"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="12"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${animatedScore} 100`}
        />

        {[0, 25, 50, 75, 100].map(mark => {
          const angle = Math.PI - (mark / 100) * Math.PI;
          const x1 = 90 + Math.cos(angle) * 55;
          const y1 = 91 - Math.sin(angle) * 55;
          const x2 = 90 + Math.cos(angle) * 61;
          const y2 = 91 - Math.sin(angle) * 61;
          return (
            <line
              key={mark}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}

        <g transform={`rotate(${needleAngle} 90 91)`}>
          <path d="M 87.5 91 L 90 43 L 92.5 91 Z" fill="#1e293b" />
        </g>
        <circle cx="90" cy="91" r="8" fill="#1e293b" />
        <circle cx="90" cy="91" r="3.5" fill="white" />

        <text
          x="90"
          y="72"
          textAnchor="middle"
          fill="#0f172a"
          stroke="white"
          strokeWidth="4"
          strokeLinejoin="round"
          paintOrder="stroke"
          className="text-[22px] font-extrabold tracking-tight"
        >
          {animatedScore}%
        </text>
        <text x="20" y="106" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">0</text>
        <text x="160" y="106" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">100</text>
      </svg>
    </div>
  );
}
