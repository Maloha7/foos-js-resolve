import React from 'react';

const FLAME = 'M32 62 C16 62 8 50 10 38 C12 28 20 24 18 12 C26 18 28 24 28 30 C30 22 34 14 32 2 C42 12 46 22 44 32 C48 28 50 24 50 20 C56 30 56 40 54 46 C52 56 44 62 32 62 Z';
const LIGHTNING_BOLTS = [
  { d: 'M14 9 L19 14 L16.5 15 L22 20', duration: 7.3, delay: 0.4 },
  { d: 'M30 2 L33 8 L30 9.5 L34 15', duration: 9.1, delay: 3.1 },
  { d: 'M50 9 L45 14 L47.5 15 L42 20', duration: 6.7, delay: 5.2 },
  { d: 'M6 22 L12 27 L8.5 29 L14 35 L10 37 L15 42 M12 27 L6 31', duration: 10.3, delay: 1.7 },
  { d: 'M58 24 L52 28 L55.5 31 L50 36 L54 39 L49 44', duration: 8.2, delay: 6.6 },
  { d: 'M12 44 L17 47 L14 49 L20 53', duration: 11.1, delay: 4.3 },
  { d: 'M52 44 L47 47 L50 49 L44 53', duration: 7.9, delay: 8.4 },
];
const SHADOW_WINGS = [
  { side: 'left', membrane: 'M30 22 L1 -5 Q6 5 -1 12 Q9 13 7 22 Q15 22 15 30 L28 30 Z', bones: 'M30 22 L-1 12 M30 22 L7 22 M30 22 L15 30' },
  { side: 'right', membrane: 'M34 22 L63 -5 Q58 5 65 12 Q55 13 57 22 Q49 22 49 30 L36 30 Z', bones: 'M34 22 L65 12 M34 22 L57 22 M34 22 L49 30' },
];
const BLAST_STREAKS = [
  { d: 'M4 16 L-2 22', dx: '-7px', dy: '6px' },
  { d: 'M9 25 L4 31', dx: '-7px', dy: '6px' },
  { d: 'M60 16 L66 22', dx: '7px', dy: '6px' },
  { d: 'M55 25 L60 31', dx: '7px', dy: '6px' },
  { d: 'M17 58 L10 58', dx: '-9px', dy: '0px' },
  { d: 'M47 58 L54 58', dx: '9px', dy: '0px' },
];
const BLAST_DUST = [
  { cx: 24, cy: 57, r: 1.2, dx: '-12px', dy: '-3px' },
  { cx: 40, cy: 57, r: 1.2, dx: '12px', dy: '-3px' },
  { cx: 19, cy: 56, r: 1, dx: '-14px', dy: '1px' },
  { cx: 45, cy: 56, r: 1, dx: '14px', dy: '1px' },
  { cx: 28, cy: 59, r: 0.9, dx: '-9px', dy: '-4px' },
  { cx: 36, cy: 59, r: 0.9, dx: '9px', dy: '-4px' },
];
const MOUTH = { x: 42, y: 24.5 };
const BREATH = [0, 0.55, 1.1, 1.65];
const SPARKS = [
  { dx: '14px', dy: '-10px', delay: 0.2 },
  { dx: '18px', dy: '-4px', delay: 0.7 },
  { dx: '11px', dy: '-16px', delay: 1.25 },
  { dx: '16px', dy: '-13px', delay: 1.8 },
];
const DANCING_FLAMES = [
  { color: '#450a0a', scale: 1, dance: 'a', duration: 1.3 },
  { color: '#991b1b', scale: 0.87, dance: 'b', duration: 0.9 },
  { color: '#dc2626', scale: 0.74, dance: 'a', duration: 0.7 },
  { color: '#ea580c', scale: 0.61, dance: 'b', duration: 1.1 },
  { color: '#f59e0b', scale: 0.48, dance: 'a', duration: 0.55 },
];
const RISING_TONGUES = [
  { x: 14, y: 58, scale: 0.3, color: '#f97316', duration: 1.1, delay: 0 },
  { x: 22, y: 56, scale: 0.38, color: '#fbbf24', duration: 0.9, delay: 0.35 },
  { x: 30, y: 54, scale: 0.34, color: '#ef4444', duration: 1.25, delay: 0.7 },
  { x: 37, y: 55, scale: 0.4, color: '#f59e0b', duration: 0.85, delay: 0.15 },
  { x: 45, y: 56, scale: 0.36, color: '#f97316', duration: 1.05, delay: 0.55 },
  { x: 51, y: 58, scale: 0.3, color: '#fde047', duration: 0.95, delay: 0.85 },
  { x: 18, y: 50, scale: 0.26, color: '#fde047', duration: 0.8, delay: 0.45 },
  { x: 47, y: 48, scale: 0.27, color: '#fbbf24', duration: 0.9, delay: 0.25 },
  { x: 26, y: 44, scale: 0.22, color: '#f97316', duration: 0.75, delay: 0.6 },
  { x: 40, y: 43, scale: 0.24, color: '#ef4444', duration: 0.8, delay: 0.05 },
];
const SIDE_FLAMES = [
  { x: 13, color: '#dc2626', dance: 'b', duration: 0.8 },
  { x: 51, color: '#ea580c', dance: 'a', duration: 0.65 },
];
const CENTER = { x: 32, y: 29 };
const TROPHY_PLACEMENT = 'translate(32 36) scale(0.75) translate(-32 -36)';

const box = (x, y, w, h) => `M${x} ${y} h${w} v${h} h${-w} Z`;

const CLASSIC_BOWL = 'M18 10 H46 V24 C46 34 40 40 32 40 C24 40 18 34 18 24 Z';

const SHAPES = {
  classic: {
    handles: 'M18 14 H10 C10 24 14 28 19 29 M46 14 H54 C54 24 50 28 45 29',
    parts: [{ d: CLASSIC_BOWL }, { d: box(29, 40, 6, 8) }, { d: box(20, 48, 24, 6) }, { d: box(16, 54, 32, 5), fill: 'edge' }],
  },
  goblet: {
    parts: [
      { d: 'M20 10 H44 C44 26 40 36 32 37 C24 36 20 26 20 10 Z' },
      { d: box(30.5, 37, 3, 13) },
      { d: box(28.5, 42, 7, 2.5) },
      { d: 'M21 55 C23 49 41 49 43 55 Z' },
      { d: box(18, 55, 28, 4), fill: 'edge' },
    ],
  },
  lovingCup: {
    handles: 'M16 15 C4 13 4 31 18 31 M48 15 C60 13 60 31 46 31',
    parts: [
      { d: 'M16 12 H48 V22 C48 33 41 39 32 39 C23 39 16 33 16 22 Z' },
      { d: box(29, 39, 6, 7) },
      { d: 'M22 46 H42 L46 54 H18 Z' },
      { d: box(14, 54, 36, 5), fill: 'edge' },
    ],
  },
  chalice: {
    handles: 'M16 13 L9 13 L11 24 L20 27 M48 13 L55 13 L53 24 L44 27',
    parts: [
      { d: 'M16 10 H48 L42 30 L32 38 L22 30 Z' },
      { d: 'M30 38 H34 L35 47 H29 Z' },
      { d: 'M20 47 H44 L48 53 H16 Z' },
      { d: box(14, 53, 36, 5), fill: 'edge' },
    ],
  },
  grand: {
    handles: 'M18 14 C8 12 8 30 20 32 M46 14 C56 12 56 30 44 32',
    parts: [
      { d: 'M20 10 C20 4 44 4 44 10 Z' },
      { d: 'M29.5 3 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 Z' },
      { d: CLASSIC_BOWL },
      { d: box(29, 40, 6, 6) },
      { d: box(22, 46, 20, 4) },
      { d: box(18, 50, 28, 4) },
      { d: box(14, 54, 36, 5), fill: 'edge' },
    ],
  },
  dragon: {
    parts: [
      { d: 'M18 11 L1 1 Q6 6 4 12 Q9 13 9 19 Q14 19 15 24 L18 26 Z' },
      { d: 'M46 11 L63 1 Q58 6 60 12 Q55 13 55 19 Q50 19 49 24 L46 26 Z' },
      { d: 'M18 10 L20 5 L23 10 L26 4 L29 10 L32 3 L35 10 L38 4 L41 10 L44 5 L46 10 V24 C46 34 40 40 32 40 C24 40 18 34 18 24 Z' },
      { d: box(29, 40, 6, 8) },
      { d: 'M20 48 H44 L46 54 H18 Z' },
      { d: box(15, 54, 34, 5), fill: 'edge' },
    ],
  },
  demon: {
    parts: [
      { d: 'M18 25 C5 22 0 9 5 0 C9 -6 18 -8 25 -3 C18 -4 13 -1 11.5 4 C10 10 14 16 21 18 Z', fill: 'horn' },
      { d: 'M46 25 C59 22 64 9 59 0 C55 -6 46 -8 39 -3 C46 -4 51 -1 52.5 4 C54 10 50 16 43 18 Z', fill: 'horn' },
      { d: 'M16 10 L22 13 L27 8 L32 13 L37 8 L42 13 L48 10 L46 24 C45 33 40 39 32 39 C24 39 19 33 18 24 Z' },
      { d: 'M29 39 H35 L37 47 H27 Z' },
      { d: 'M16 54 L20 47 H44 L48 54 Z' },
      { d: box(13, 54, 38, 5), fill: 'edge' },
    ],
  },
};

const scaledAround = (x, y, scale) => `translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`;

const starPoints = (cx, cy, outer, inner, spikes = 5) =>
  Array.from({ length: spikes * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');

const sparklePath = (x, y, r) =>
  `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

const rayWedges = (count, radius) =>
  Array.from({ length: count }, (_, i) => {
    const angle = ((2 * Math.PI) / count) * i;
    const spread = Math.PI / (count * 2.2);
    const point = (a) => `${(CENTER.x + radius * Math.cos(a)).toFixed(2)},${(CENTER.y + radius * Math.sin(a)).toFixed(2)}`;
    return `M${CENTER.x} ${CENTER.y} L${point(angle - spread)} L${point(angle + spread)} Z`;
  }).join(' ');

const Halo = ({ color, pulse }) => (
  <g className={pulse ? 'season-badge-pulse' : undefined} fill={color}>
    <circle cx={CENTER.x} cy={CENTER.y} r="30" opacity="0.14" />
    <circle cx={CENTER.x} cy={CENTER.y} r="23" opacity="0.2" />
  </g>
);

const SunBurst = ({ color }) => (
  <g fill={color}>
    <path className="season-badge-ray-burst" d={rayWedges(12, 32)} />
    <path className="season-badge-ray-burst season-badge-ray-burst-late" d={rayWedges(12, 32)} transform={`rotate(15 ${CENTER.x} ${CENTER.y})`} />
  </g>
);

const BeatingWings = () => (
  <g>
    {SHADOW_WINGS.map(({ side, membrane, bones }) => (
      <g key={side} className={`season-dragon-wing-${side}`}>
        <path d={membrane} fill="#3b0a0a" stroke="#b91c1c" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={bones} fill="none" stroke="#7f1d1d" strokeWidth="1" />
      </g>
    ))}
  </g>
);

const WingBlast = () => (
  <g>
    <g fill="none" stroke="#fecaca" strokeWidth="2">
      <ellipse className="season-dragon-shockwave" cx="32" cy="56" rx="16" ry="3.5" />
      <ellipse className="season-dragon-shockwave season-dragon-shockwave-late" cx="32" cy="56" rx="16" ry="3.5" />
    </g>
    <g stroke="#fecaca" strokeWidth="1.4" strokeLinecap="round">
      {BLAST_STREAKS.map(({ d, dx, dy }) => (
        <path key={d} className="season-dragon-fling" style={{ '--dx': dx, '--dy': dy }} d={d} />
      ))}
    </g>
    <g fill="#d6d3d1">
      {BLAST_DUST.map(({ cx, cy, r, dx, dy }) => (
        <circle key={`${cx}-${cy}`} className="season-dragon-fling" style={{ '--dx': dx, '--dy': dy }} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  </g>
);

const DragonGlow = () => (
  <g className="season-dragon-flash" fill="#dc2626">
    <circle cx={CENTER.x} cy={CENTER.y} r="30" opacity="0.16" />
    <circle cx={CENTER.x} cy={CENTER.y} r="22" opacity="0.24" />
  </g>
);

const DancingFlames = () => (
  <g>
    {SIDE_FLAMES.map(({ x, color, dance, duration }) => (
      <g key={x} className={`season-flame-dance-${dance}`} style={{ animationDuration: `${duration}s`, transformOrigin: `${x}px 62px` }}>
        <path d={FLAME} fill={color} transform={`translate(${x - 32} 0) ${scaledAround(32, 62, 0.5)}`} />
      </g>
    ))}
    {DANCING_FLAMES.map(({ color, scale, dance, duration }) => (
      <g key={color} className={`season-flame-dance-${dance}`} style={{ animationDuration: `${duration}s` }}>
        <path d={FLAME} fill={color} transform={scaledAround(32, 62, scale)} />
      </g>
    ))}
    {RISING_TONGUES.map(({ x, y, scale, color, duration, delay }) => (
      <g key={`${x}-${y}`} className="season-flame-rise" style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        <path d={FLAME} fill={color} transform={`translate(${x - 32} ${y - 62}) ${scaledAround(32, 62, scale)}`} />
      </g>
    ))}
  </g>
);

const Lightning = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    {LIGHTNING_BOLTS.map(({ d, duration, delay }) => (
      <g key={d} className="season-badge-bolt" style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        <path d={d} stroke="#a855f7" strokeWidth="4" />
        <path d={d} stroke="#f3e8ff" strokeWidth="1.4" />
      </g>
    ))}
  </g>
);

const Sparkles = () => (
  <g fill="#ffffff">
    <path className="season-badge-sparkle" d={sparklePath(55, 9, 5)} />
    <path className="season-badge-sparkle season-badge-delay-1" d={sparklePath(9, 40, 4)} />
    <path className="season-badge-sparkle season-badge-delay-2" d={sparklePath(54, 44, 3)} />
    <path className="season-badge-sparkle season-badge-delay-1" d={sparklePath(11, 10, 3)} />
  </g>
);

const EMBERS = [
  [14, 40, 1.6], [50, 36, 1.4], [22, 20, 1.2], [44, 16, 1.5],
  [8, 26, 1.1], [57, 24, 1.3], [30, 8, 1.2], [38, 52, 1.4],
];

const Embers = () => (
  <g fill="#fbbf24">
    {EMBERS.map(([cx, cy, r], i) => (
      <circle key={`${cx}-${cy}`} className={`season-badge-ember season-badge-delay-${i % 3}`} cx={cx} cy={cy} r={r} />
    ))}
  </g>
);

const Trophy = ({ shape, fill, edge, horn, children }) => {
  const { handles, parts } = SHAPES[shape];
  const colorOf = (key) => ({ edge, horn }[key] ?? fill);
  return (
    <g transform={TROPHY_PLACEMENT} strokeLinejoin="round">
      <g fill="#000000" stroke="#000000" strokeWidth="6">
        {handles ? <path d={handles} fill="none" strokeWidth="8" /> : null}
        {parts.map(({ d }) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g stroke={edge} strokeWidth="2.5">
        {handles ? <path d={handles} fill="none" strokeWidth="4" /> : null}
        {parts.map(({ d, fill: key }) => (
          <path key={d} d={d} fill={colorOf(key)} />
        ))}
      </g>
      {children}
    </g>
  );
};

const StarEmblem = () => <polygon points={starPoints(32, 22, 7, 3)} fill="#ffffff" stroke="#6b7280" strokeWidth="0.8" />;

const StarClusterEmblem = () => (
  <g fill="#fff7d6" stroke="#a16207" strokeWidth="0.8">
    <polygon points={starPoints(32, 25, 7, 3)} />
    <polygon points={starPoints(23.5, 18, 3, 1.3)} />
    <polygon points={starPoints(40.5, 18, 3, 1.3)} />
  </g>
);

const DiamondEmblem = () => (
  <g stroke="#0f766e" strokeWidth="1">
    <polygon points="26,15 38,15 42,20 32,31 22,20" fill="#ccfbf1" />
    <path d="M22 20 H42 M26 15 L29 20 L32 31 L35 20 L38 15 M32 15 V20" fill="none" />
  </g>
);

const CrownEmblem = () => (
  <g stroke="#3b0764" strokeWidth="1.2" strokeLinejoin="round">
    <path d="M23 31 L24.5 18 L28.5 24 L32 15 L35.5 24 L39.5 18 L41 31 Z" fill="#fde68a" />
    <rect x="23" y="30" width="18" height="4" rx="0.8" fill="#facc15" />
    <circle cx="24.5" cy="18" r="1.8" fill="#e879f9" />
    <circle cx="32" cy="15" r="1.8" fill="#e879f9" />
    <circle cx="39.5" cy="18" r="1.8" fill="#e879f9" />
  </g>
);

const DragonDetails = () => (
  <g fill="none">
    <path d="M18 11 L4 12 M18 11 L9 19 M18 11 L15 24 M46 11 L60 12 M46 11 L55 19 M46 11 L49 24" stroke="#450a0a" strokeWidth="1" />
  </g>
);

const DragonHeadEmblem = () => (
  <g strokeLinejoin="round">
    <polygon className="season-dragon-maw" points="31,23.8 37,22.2 43.5,21.8 41.5,27.6 32.5,26.2" fill="#f97316" />
    <g fill="#1c0505" stroke="#ef4444" strokeWidth="0.6">
      <path d="M27 15.5 L16 9.5 L23.5 17.5 Z M30.5 14.6 L21.5 6.5 L28 15.4 Z" fill="#e7e5e4" stroke="#1c0505" />
      <path d="M22 22 L18 23 L21.5 25 Z M21.3 27 L17.5 28.6 L21.4 30.2 Z M22.6 32 L19 34.2 L23.2 34.6 Z" fill="#7f1d1d" />
      <path d="M21 26 C20 30 22 34 25 37 L30 37 C28 34 26 31 26 28 Z" />
      <path d="M21 26 C20 19 25 14 31 14 L36 15.5 L42 18.5 L43.8 21.6 L37 22.2 L32 23.6 C30 24.6 28 26 26 28 Z" />
      <path d="M26 28 L32.5 26.2 L41.5 27.6 L37 29.6 L31 32 C29 32.6 27 31 26 28 Z" />
    </g>
    <g fill="#f5f5f4">
      <polygon points="35,22.5 36,24.4 37,22.3" />
      <polygon points="39.2,22 40,23.6 40.8,21.9" />
      <polygon points="34.2,26.5 35.2,24.9 36.2,26.7" />
      <polygon points="38.4,27.2 39.2,25.8 40,27.4" />
    </g>
    <polygon className="season-dragon-eye" points="30.8,18.4 35.6,17.2 34,19.6" fill="#fde047" />
    <path d="M30 17.4 L36.4 15.8" stroke="#ef4444" strokeWidth="0.9" strokeLinecap="round" />
    <circle cx="41.6" cy="19.6" r="0.6" fill="#0c0a09" />
  </g>
);

const DragonBreath = () => (
  <g>
    {BREATH.map((delay) => (
      <g key={delay} className="season-dragon-smoke" style={{ animationDelay: `${delay}s` }} fill="#d6d3d1">
        <circle cx={MOUTH.x} cy={MOUTH.y} r="1.8" />
        <circle cx={MOUTH.x - 1.2} cy={MOUTH.y + 1} r="1.3" />
        <circle cx={MOUTH.x + 1.3} cy={MOUTH.y + 1.1} r="1.2" />
      </g>
    ))}
    {SPARKS.map(({ dx, dy, delay }) => (
      <circle
        key={delay}
        className="season-dragon-spark"
        style={{ '--dx': dx, '--dy': dy, animationDelay: `${delay}s` }}
        cx={MOUTH.x}
        cy={MOUTH.y}
        r="0.8"
        fill="#fbbf24"
      />
    ))}
  </g>
);

const HORN_RIDGES = 'M3.5 13 L11 11 M3 6 L10.5 5 M6.5 -1.5 L12 2 M13 -5 L15.5 -1.5 M60.5 13 L53 11 M61 6 L53.5 5 M57.5 -1.5 L52 2 M51 -5 L48.5 -1.5';

const HornDetails = () => (
  <g fill="none" strokeLinecap="round">
    <path d={HORN_RIDGES} stroke="#7c2d12" strokeWidth="1.4" />
    <path d="M14 17 C6 13 4 5 9 -1 M50 17 C58 13 60 5 55 -1" stroke="#fed7aa" strokeWidth="1" opacity="0.8" />
  </g>
);

const BeastSkullEmblem = () => (
  <g strokeLinejoin="round">
    <path
      d="M32 14 C26 14 23.5 18 23.5 22 C23.5 26 25.5 28 26.5 30 L27 35 L29.5 33.5 L32 37 L34.5 33.5 L37 35 L37.5 30 C38.5 28 40.5 26 40.5 22 C40.5 18 38 14 32 14 Z"
      fill="#f97316"
      stroke="#7c2d12"
      strokeWidth="1"
    />
    <path d="M25.5 20 L31 23 L27 26.5 Z M38.5 20 L33 23 L37 26.5 Z" fill="#1c0a00" />
    <circle cx="28.6" cy="23.3" r="1.2" fill="#fde047" />
    <circle cx="35.4" cy="23.3" r="1.2" fill="#fde047" />
    <path d="M31 27 L32 29.5 L33 27 Z" fill="#1c0a00" />
    <path d="M29 31 V33 M32 31 V34 M35 31 V33" stroke="#1c0a00" strokeWidth="0.9" />
  </g>
);

const Clown = () => (
  <>
    <circle cx="14" cy="32" r="8" fill="#f97316" />
    <circle cx="50" cy="32" r="8" fill="#f97316" />
    <circle cx="12" cy="41" r="6" fill="#ef4444" />
    <circle cx="52" cy="41" r="6" fill="#ef4444" />
    <circle cx="32" cy="38" r="18" fill="#fef3c7" stroke="#9ca3af" strokeWidth="1.5" />
    <path d="M25 26 L28.5 31 L25 36 L21.5 31 Z" fill="#60a5fa" />
    <path d="M39 26 L42.5 31 L39 36 L35.5 31 Z" fill="#60a5fa" />
    <circle cx="25" cy="31" r="1.8" fill="#111827" />
    <circle cx="39" cy="31" r="1.8" fill="#111827" />
    <path d="M21 44 Q32 57 43 44 Q32 50 21 44 Z" fill="#dc2626" />
    <circle cx="32" cy="39" r="4.5" fill="#dc2626" />
    <path d="M22 21 L32 3 L42 21 Z" fill="#a855f7" stroke="#6b21a8" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="32" cy="4" r="3" fill="#facc15" />
  </>
);

const TIERS = [
  {
    minWins: 20,
    className: 'season-badge-glow-hellfire',
    art: () => (
      <>
        <DancingFlames />
        <Embers />
        <Trophy shape="demon" fill="#18181b" edge="#dc2626" horn="#f97316">
          <HornDetails />
          <BeastSkullEmblem />
        </Trophy>
      </>
    ),
  },
  {
    minWins: 15,
    className: 'season-badge-glow-dragon',
    art: () => (
      <g className="season-dragon-shake">
        <DragonGlow />
        <BeatingWings />
        <WingBlast />
        <g className="season-dragon-lift">
          <Trophy shape="dragon" fill="#b91c1c" edge="#450a0a">
            <DragonDetails />
            <DragonHeadEmblem />
            <DragonBreath />
          </Trophy>
        </g>
      </g>
    ),
  },
  {
    minWins: 10,
    className: 'season-badge-glow-purple',
    art: () => (
      <>
        <Halo color="#a855f7" />
        <Lightning />
        <Trophy shape="grand" fill="#9333ea" edge="#3b0764">
          <CrownEmblem />
        </Trophy>
      </>
    ),
  },
  {
    minWins: 5,
    className: 'season-badge-glow-teal',
    art: () => (
      <>
        <Halo color="#2dd4bf" />
        <Sparkles />
        <Trophy shape="chalice" fill="#2dd4bf" edge="#0f766e">
          <path d="M20 13 L24 26" fill="none" stroke="#f0fdfa" strokeWidth="2" opacity="0.7" />
          <DiamondEmblem />
        </Trophy>
      </>
    ),
  },
  {
    minWins: 3,
    art: () => (
      <>
        <SunBurst color="#facc15" />
        <Trophy shape="lovingCup" fill="#facc15" edge="#a16207">
          <StarClusterEmblem />
        </Trophy>
      </>
    ),
  },
  {
    minWins: 2,
    art: () => (
      <>
        <Halo color="#e5e7eb" pulse />
        <Trophy shape="goblet" fill="#d1d5db" edge="#6b7280">
          <StarEmblem />
        </Trophy>
      </>
    ),
  },
  { minWins: 1, art: () => <Trophy shape="classic" fill="#cd7f32" edge="#7c4a1e" /> },
  { minWins: 0, art: () => <Clown /> },
];

const tierFor = (seasonsWon) => TIERS.find((tier) => seasonsWon >= tier.minWins);

const rankRequirements = TIERS.map((tier) => tier.minWins);

const currentRankFor = (seasonsWon) => tierFor(seasonsWon)?.minWins;

const winsToNextRank = (seasonsWon) => {
  const next = [...rankRequirements].reverse().find((minWins) => minWins > seasonsWon);
  return next === undefined ? null : next - seasonsWon;
};

const SeasonWinsBadge = ({ seasonsWon, size = 48 }) => {
  const tier = tierFor(seasonsWon);
  if (!tier) return null;
  return (
    <svg
      className={tier.className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      overflow="visible"
      role="img"
      aria-label={`${seasonsWon} seasons won`}
    >
      {tier.art()}
    </svg>
  );
};

export { SeasonWinsBadge, rankRequirements, currentRankFor, winsToNextRank };
