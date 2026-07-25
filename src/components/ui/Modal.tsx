import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-10 sm:py-12"
      style={{ background: 'rgba(3,7,18,0.74)', backdropFilter: 'blur(5px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative flex w-full max-h-[calc(100dvh-5rem)] flex-col overflow-hidden animate-slide-up', sizes[size])}
        style={{
          background: '#0D1632',
          border: '1px solid rgba(241,240,218,0.14)',
          borderRadius: 6,
          boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
        }}
      >
        <div className="sticky top-0 z-10 flex min-h-14 items-center justify-between px-5 py-3" style={{ background: '#0D1632', borderBottom: '1px solid rgba(241,240,218,0.09)' }}>
          <h2 className="pr-8 font-bold text-cream text-base">{title ?? 'Dialog'}</h2>
          <button type="button" onClick={onClose} className="btn-ghost !p-2 -mr-2" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
