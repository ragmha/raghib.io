'use client'

export function Hero() {
  return (
    <div className="flex flex-col gap-6 items-center w-full">
      <h1 className="relative inline-block whitespace-nowrap text-3xl sm:text-4xl md:text-5xl font-bold uppercase font-mono leading-none">
        <span
          aria-hidden
          className="absolute inset-0 translate-x-[2px] translate-y-[2px] text-[#656363]"
          style={{ wordSpacing: '-0.25em' }}
        >
          RAGHIB HASAN
        </span>
        <span className="relative text-[#f1ecec]" style={{ wordSpacing: '-0.25em' }}>
          RAGHIB HASAN
        </span>
      </h1>

      <svg viewBox="0 0 420 420" className="w-full max-w-[120px] sm:max-w-[170px]" aria-hidden>
        <defs>
          <filter id="ring-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="6" dy="8" stdDeviation="7" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(210 210) rotate(-90)">
          <circle r="150" fill="none" stroke="#4a0014" strokeWidth="44" />
          <circle r="104" fill="none" stroke="#194c00" strokeWidth="42" />
          <circle r="62" fill="none" stroke="#00343b" strokeWidth="40" />

          <circle
            className="ring-spin-outer"
            r="150"
            fill="none"
            stroke="#ff4e99"
            strokeWidth="44"
            strokeLinecap="round"
            strokeDasharray="1 999"
            filter="url(#ring-shadow)"
          />
          <circle
            className="ring-spin-middle"
            r="104"
            fill="none"
            stroke="#b4ff2e"
            strokeWidth="42"
            strokeLinecap="round"
            strokeDasharray="1 999"
            filter="url(#ring-shadow)"
          />
          <circle
            className="ring-spin-inner"
            r="62"
            fill="none"
            stroke="#3ff0ea"
            strokeWidth="40"
            strokeLinecap="round"
            strokeDasharray="1 999"
            filter="url(#ring-shadow)"
          />
        </g>

        <circle cx="210" cy="210" r="32" fill="#050506" />
        <circle cx="210" cy="60" r="18" fill="#ff2d55" />
        <circle cx="210" cy="106" r="16" fill="#a3ff12" />
        <circle cx="210" cy="148" r="14" fill="#23ddd7" />
        <text x="210" y="70" textAnchor="middle" className="fill-black font-bold text-[26px]">
          →
        </text>
        <text x="210" y="114" textAnchor="middle" className="fill-black font-bold text-[24px]">
          »
        </text>
        <text x="210" y="155" textAnchor="middle" className="fill-black font-bold text-[22px]">
          ↑
        </text>
      </svg>
    </div>
  )
}
