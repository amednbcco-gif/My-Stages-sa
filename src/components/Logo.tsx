export function Stages({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-ink-900 ring-1 ring-gold/20"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 512 512" fill="none">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0b429" />
            <stop offset="1" stopColor="#d4af37" />
          </linearGradient>
        </defs>
        <path
          d="M312 168 C312 140 288 124 252 124 C214 124 192 142 192 168 C192 192 210 204 248 212 L276 218 C322 228 344 246 344 282 C344 322 308 348 252 348 C196 348 160 322 160 278"
          fill="none"
          stroke="url(#logo-g)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="252" cy="124" r="14" fill="#f0b429" />
        <circle cx="252" cy="348" r="14" fill="#1a4abf" />
      </svg>
    </div>
  );
}

export function StagesHero({ size = 120 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-ink-800 to-ink-900 shadow-2xl ring-1 ring-gold/30"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gold/5 blur-xl" />
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 512 512" fill="none" className="relative">
          <defs>
            <linearGradient id="hero-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f0b429" />
              <stop offset="1" stopColor="#d4af37" />
            </linearGradient>
            <filter id="hero-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M312 168 C312 140 288 124 252 124 C214 124 192 142 192 168 C192 192 210 204 248 212 L276 218 C322 228 344 246 344 282 C344 322 308 348 252 348 C196 348 160 322 160 278"
            fill="none"
            stroke="url(#hero-g)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#hero-glow)"
          />
          <circle cx="252" cy="124" r="14" fill="#f0b429" />
          <circle cx="252" cy="348" r="14" fill="#1a4abf" />
        </svg>
      </div>
    </div>
  );
}

export function StagesFooter({ size = 56 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-2xl bg-ink-800 ring-1 ring-gold/15"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 512 512" fill="none">
          <defs>
            <linearGradient id="footer-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f0b429" />
              <stop offset="1" stopColor="#d4af37" />
            </linearGradient>
          </defs>
          <path
            d="M312 168 C312 140 288 124 252 124 C214 124 192 142 192 168 C192 192 210 204 248 212 L276 218 C322 228 344 246 344 282 C344 322 308 348 252 348 C196 348 160 322 160 278"
            fill="none"
            stroke="url(#footer-g)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="252" cy="124" r="14" fill="#f0b429" />
          <circle cx="252" cy="348" r="14" fill="#1a4abf" />
        </svg>
      </div>
      <span className="text-sm font-bold tracking-widest text-gold">STAGES</span>
    </div>
  );
}
