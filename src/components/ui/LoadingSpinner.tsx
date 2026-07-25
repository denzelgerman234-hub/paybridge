import { PBMark } from '../brand/Logo';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'panel';
}

export function LoadingSpinner({ text = 'Loading...', fullScreen = true, variant = 'default' }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: '#0B132F' }}
      >
        {/* Minimal animated mark */}
        <div className="relative">
          <div className="animate-pulse-gold">
            <PBMark size={40} color="#C9A84C" />
          </div>
        </div>

        {/* Thin gold progress bar */}
        <div className="w-32 h-px overflow-hidden" style={{ background: 'rgba(241,240,218,0.08)' }}>
          <div
            className="h-full"
            style={{
              background: '#C9A84C',
              width: '40%',
              animation: 'loading-sweep 1.4s ease-in-out infinite',
            }}
          />
        </div>

        <p
          className="text-xs tracking-widest uppercase"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            color: 'rgba(241,240,218,0.35)',
            letterSpacing: '0.12em',
          }}
        >
          {text}
        </p>

        <style>{`
          @keyframes loading-sweep {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  if (variant === 'panel') {
    return (
      <div className="rounded border border-gold/20 bg-gold/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="animate-pulse-gold flex-shrink-0">
            <PBMark size={22} color="#C9A84C" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] uppercase"
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                color: 'rgba(241,240,218,0.45)',
                letterSpacing: '0.1em',
              }}
            >
              {text}
            </p>
            <div className="mt-2 h-px overflow-hidden" style={{ background: 'rgba(241,240,218,0.1)' }}>
              <div
                className="h-full"
                style={{
                  background: '#C9A84C',
                  width: '35%',
                  animation: 'loading-sweep 1.4s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes loading-sweep {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-10">
      <div
        className="w-4 h-4 rounded-sm"
        style={{
          background: '#C9A84C',
          animation: 'pulse 1.2s ease-in-out infinite',
          opacity: 0.7,
        }}
      />
      <span
        className="text-xs tracking-widest uppercase"
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          color: 'rgba(241,240,218,0.4)',
          letterSpacing: '0.1em',
        }}
      >
        {text}
      </span>
    </div>
  );
}
