/**
 * LottieIcon — lightweight wrapper around lottie-react
 * Uses free public Lottie animation URLs from LottieFiles CDN
 * 
 * Usage:
 *   <LottieIcon name="wallet" size={64} />
 *   <LottieIcon name="success" size={80} loop={false} />
 */

import Lottie from 'lottie-react';

// Free outline/minimal Lottie animations from LottieFiles public CDN
// These are hosted JSON animations — no API key needed
const LOTTIE_URLS: Record<string, string> = {
  wallet:      'https://assets9.lottiefiles.com/packages/lf20_06a6pf9i.json',
  check:       'https://assets4.lottiefiles.com/packages/lf20_jbrw3hcz.json',
  loading:     'https://assets5.lottiefiles.com/packages/lf20_szlepvdh.json',
  coins:       'https://assets10.lottiefiles.com/packages/lf20_yd9fznpy.json',
  shield:      'https://assets7.lottiefiles.com/packages/lf20_qp1q7mct.json',
  chart:       'https://assets8.lottiefiles.com/packages/lf20_qp1q7mct.json',
  handshake:   'https://assets10.lottiefiles.com/packages/lf20_touohxv0.json',
  bell:        'https://assets4.lottiefiles.com/packages/lf20_iljplj1v.json',
  rocket:      'https://assets6.lottiefiles.com/private_files/lf30_wqivietl.json',
  success:     'https://assets4.lottiefiles.com/packages/lf20_jbrw3hcz.json',
};

interface LottieIconProps {
  name: keyof typeof LOTTIE_URLS;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

import { useState, useEffect } from 'react';

export function LottieIcon({ name, size = 48, loop = true, autoplay = true, className = '' }: LottieIconProps) {
  const [animData, setAnimData] = useState<object | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url = LOTTIE_URLS[name];
    if (!url) { setError(true); return; }
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setAnimData(data))
      .catch(() => setError(true));
  }, [name]);

  if (error || !animData) {
    // Fallback: small gold square placeholder
    return (
      <div
        style={{ width: size, height: size, background: 'rgba(201,168,76,0.15)', borderRadius: 4 }}
        className={className}
      />
    );
  }

  return (
    <Lottie
      animationData={animData}
      loop={loop}
      autoplay={autoplay}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}

export { LOTTIE_URLS };
