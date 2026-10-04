// Blantyre City Council coat of arms — lightweight SVG recreation.
// Heraldry simplified for screen: sun crest, mantling, helmet, blue shield
// with white saltire, red heart, two gold crosses, thistle, motto scroll.
export default function CouncilLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 230"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Blantyre City Council coat of arms"
    >
      <defs>
        <radialGradient id="bcc-sun" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0%" stopColor="#FFE9A3" />
          <stop offset="55%" stopColor="#FFC93C" />
          <stop offset="100%" stopColor="#E8A200" />
        </radialGradient>
        <linearGradient id="bcc-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F7FD4" />
          <stop offset="100%" stopColor="#1E5FA8" />
        </linearGradient>
      </defs>

      {/* Sun rays */}
      <g stroke="#E8A200" strokeWidth="3" strokeLinecap="round">
        <line x1="100" y1="8" x2="100" y2="30" />
        <line x1="70" y1="14" x2="78" y2="34" />
        <line x1="130" y1="14" x2="122" y2="34" />
        <line x1="48" y1="30" x2="62" y2="45" />
        <line x1="152" y1="30" x2="138" y2="45" />
        <line x1="58" y1="18" x2="68" y2="38" />
        <line x1="142" y1="18" x2="132" y2="38" />
      </g>

      {/* Sun disc with dog silhouette */}
      <circle cx="100" cy="52" r="26" fill="url(#bcc-sun)" />
      <path
        d="M88 58 c0 -10 8 -16 15 -16 c6 0 10 3 12 7 c4 1 6 4 5 7 c-2 4 -8 6 -14 6 l-2 6 h-3 l-1 -5 c-6 0 -12 -2 -12 -5 z"
        fill="#7A4A1D"
      />
      <circle cx="112" cy="51" r="1.6" fill="#2B2B2B" />

      {/* Mantling (blue + mint leaves) */}
      <g>
        <path d="M100 84 C70 74 40 82 22 108 C40 104 48 112 46 128 C58 118 66 122 70 138 C78 126 88 126 92 140 L100 96 Z" fill="#3D8FD4" />
        <path d="M100 84 C130 74 160 82 178 108 C160 104 152 112 154 128 C142 118 134 122 130 138 C122 126 112 126 108 140 L100 96 Z" fill="#3D8FD4" />
        <path d="M100 84 C76 78 52 88 38 110 C50 108 56 116 55 130 C64 122 70 126 74 138 C80 128 88 128 92 138 L100 96 Z" fill="#BFEBC8" />
        <path d="M100 84 C124 78 148 88 162 110 C150 108 144 116 145 130 C136 122 130 126 126 138 C120 128 112 128 108 138 L100 96 Z" fill="#BFEBC8" />
      </g>

      {/* Helmet */}
      <path d="M84 92 L116 92 L112 128 L88 128 Z" fill="#E8E8E8" stroke="#9A9A9A" strokeWidth="1.5" />
      <path d="M84 92 L116 92 L114 104 L86 104 Z" fill="#C9C9C9" />
      <path d="M88 128 h24 l-3 10 h-18 z" fill="#B9B9B9" />

      {/* Shield */}
      <path
        d="M62 112 h76 c0 34 -6 58 -38 74 c-32 -16 -38 -40 -38 -74 z"
        fill="url(#bcc-shield)"
        stroke="#153F73"
        strokeWidth="2"
      />
      {/* White saltire */}
      <g stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round">
        <line x1="66" y1="118" x2="134" y2="172" />
        <line x1="134" y1="118" x2="66" y2="172" />
      </g>
      <path
        d="M62 112 h76 c0 34 -6 58 -38 74 c-32 -16 -38 -40 -38 -74 z"
        fill="none"
        stroke="#153F73"
        strokeWidth="2"
      />
      {/* Red heart */}
      <path
        d="M100 148 c-4 -8 -14 -8 -16 0 c-2 7 6 13 16 20 c10 -7 18 -13 16 -20 c-2 -8 -12 -8 -16 0 z"
        fill="#D7263D"
      />
      {/* Gold crosses */}
      <g fill="#E8A200">
        <rect x="76" y="132" width="7" height="22" rx="1.5" />
        <rect x="70" y="138" width="19" height="7" rx="1.5" />
        <rect x="117" y="132" width="7" height="22" rx="1.5" />
        <rect x="110" y="138" width="19" height="7" rx="1.5" />
      </g>
      {/* Thistle */}
      <g>
        <path d="M100 172 v18" stroke="#3F7A3F" strokeWidth="3" />
        <path d="M100 168 c-5 -6 -3 -14 0 -16 c3 2 5 10 0 16 z" fill="#7C4FA0" />
        <path d="M93 172 c-4 -5 -2 -11 1 -12 c2 3 3 9 -1 12 z" fill="#7C4FA0" />
        <path d="M107 172 c4 -5 2 -11 -1 -12 c-2 3 -3 9 1 12 z" fill="#7C4FA0" />
        <path d="M95 173 c-4 0 -7 -3 -7 -6 c4 -1 8 1 7 6 z" fill="#4C8B4C" />
        <path d="M105 173 c4 0 7 -3 7 -6 c-4 -1 -8 1 -7 6 z" fill="#4C8B4C" />
      </g>
      {/* Motto scroll */}
      <path
        d="M30 198 c25 8 115 8 140 0 l-6 14 c-24 7 -104 7 -128 0 z"
        fill="#F5F0E6"
        stroke="#8A8A7A"
        strokeWidth="1.5"
      />
      <text
        x="100"
        y="210"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#B3122F"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="1"
      >
        UNITY IS STRENGTH
      </text>
    </svg>
  );
}
