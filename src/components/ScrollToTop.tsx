import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const rawTargetId = hash.slice(1);
      const targetId = (() => {
        try {
          return decodeURIComponent(rawTargetId);
        } catch {
          return rawTargetId;
        }
      })();
      let frameId = 0;
      let timeoutId = 0;
      let attempts = 0;

      const scrollToHash = () => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          return;
        }

        attempts += 1;
        if (attempts < 30) {
          frameId = window.requestAnimationFrame(scrollToHash);
        } else if (attempts < 80) {
          timeoutId = window.setTimeout(scrollToHash, 50);
        }
      };

      timeoutId = window.setTimeout(scrollToHash, 80);

      return () => {
        window.clearTimeout(timeoutId);
        window.cancelAnimationFrame(frameId);
      };
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash, key]);

  return null;
}
