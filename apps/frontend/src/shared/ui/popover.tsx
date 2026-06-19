import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';

type Placement = 'bottom-start' | 'bottom-end' | 'right-start' | 'top-stretch';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Element the popover is positioned against. */
  anchorRef: RefObject<HTMLElement | null>;
  placement?: Placement;
  className?: string;
  children: ReactNode;
}

const GAP = 6;

/**
 * Lightweight anchored popover: a fixed, portalled panel positioned relative to
 * an anchor element, with a click-catching scrim. Closes on scrim click or Esc.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  placement = 'bottom-start',
  className,
  children,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!open) return;

    const reposition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const next: React.CSSProperties = { position: 'fixed', visibility: 'visible' };

      switch (placement) {
        case 'bottom-end':
          next.top = r.bottom + GAP;
          next.right = window.innerWidth - r.right;
          break;
        case 'right-start':
          next.top = r.top;
          next.left = r.right + GAP;
          break;
        case 'top-stretch':
          next.bottom = window.innerHeight - r.top + GAP;
          next.left = r.left;
          next.width = r.width;
          break;
        case 'bottom-start':
        default:
          next.top = r.bottom + GAP;
          next.left = r.left;
          break;
      }
      setStyle(next);
    };

    reposition();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, placement, anchorRef, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-foreground/[0.04]" onMouseDown={onClose} />
      <div
        ref={panelRef}
        style={style}
        className={cn(
          'z-[60] animate-fade-in-up rounded-2xl border border-border bg-white p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]',
          className,
        )}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
