/**
 * PayBridge Logo Components
 * Three parallelograms arranged in a staircase/bridge pattern
 * matching the brand asset: top-center, bottom-left, bottom-right
 */

interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/** The 3-parallelogram icon mark — faithful to brand asset */
export function PBMark({ size = 32, color = '#F1F0DA', className = '' }: LogoProps) {
  // Parallelogram skew offset = 8px at height 10
  // Viewport 48 × 28
  return (
    <svg
      width={size}
      height={size * 0.58}
      viewBox="0 0 48 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PayBridge mark"
    >
      {/* Top-center parallelogram */}
      <polygon points="14,0 34,0 28,11 8,11" fill={color} />
      {/* Bottom-left parallelogram */}
      <polygon points="0,17 20,17 14,28 -6,28" fill={color} />
      {/* Bottom-right parallelogram */}
      <polygon points="28,17 48,17 42,28 22,28" fill={color} />
    </svg>
  );
}

/** Inline nav logo: mark + wordmark */
export function PBNav({ color = '#F1F0DA', className = '' }: { color?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ userSelect: 'none' }}>
      <PBMark size={24} color={color} />
      <span
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color,
          letterSpacing: '0.1em',
          lineHeight: 1,
        }}
      >
        PAYBRIDGE
      </span>
    </div>
  );
}

/** Stacked logo: mark above wordmark + tagline */
export function PBLogo({ size = 28, color = '#F1F0DA', className = '' }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`} style={{ userSelect: 'none' }}>
      <PBMark size={size} color={color} />
      <span
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: size * 0.6,
          color,
          letterSpacing: '0.1em',
          lineHeight: 1,
        }}
      >
        PAYBRIDGE
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: size * 0.28,
          color: color === '#F1F0DA' ? 'rgba(241,240,218,0.45)' : color,
          letterSpacing: '0.18em',
          lineHeight: 1,
        }}
      >
        MOVE MONEY SAFELY
      </span>
    </div>
  );
}

/** Mark only */
export function PBIcon({ size = 20, color = '#F1F0DA', className = '' }: LogoProps) {
  return <PBMark size={size} color={color} className={className} />;
}
