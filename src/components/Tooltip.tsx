import { useState } from 'react';
import type { ReactNode } from 'react';
import './Tooltip.css';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  showOnHover?: boolean;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  delay = 300,
  showOnHover = true 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!showOnHover) return;
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`tooltip tooltip-${position}`}>
          <div className="tooltip-arrow"></div>
          <div className="tooltip-content">{content}</div>
        </div>
      )}
    </div>
  );
}

interface FirstTimeTooltipProps {
  id: string;
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  activeId?: string | null; // when provided, only show if id === activeId
  onNext?: () => void; // called when user clicks Next/Got it
  onSkip?: () => void; // optional skip handler to end tour
}

const TOOLTIP_SEEN_KEY_PREFIX = 'neon-sentinel-tooltip-seen-';

export function FirstTimeTooltip({ 
  id, 
  content, 
  children, 
  position = 'top',
  activeId = null,
  onNext,
  onSkip,
}: FirstTimeTooltipProps) {
  const storageKey = `${TOOLTIP_SEEN_KEY_PREFIX}${id}`;
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem(storageKey) !== 'true';
  });

  // If we are sequencing tooltips, only render when active
  if (activeId !== null && activeId !== id) {
    return <>{children}</>;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    onNext?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    onSkip?.();
  };

  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <div className="first-time-tooltip-wrapper">
      {children}
      <div className={`first-time-tooltip first-time-tooltip-${position}`}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-content">{content}</div>
        <button 
          className="tooltip-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss tooltip"
        >
          Next
        </button>
        {onSkip && (
          <button
            className="tooltip-dismiss-btn tooltip-skip-btn"
            onClick={handleSkip}
            aria-label="Skip tour"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}

