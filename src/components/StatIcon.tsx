interface StatIconProps {
  type: 'target' | 'rocket' | 'running' | 'clock' | 'skull' | 'shield' | 'cubes' | 'trophy' | 'accuracy' | 'biohazard';
  size?: number;
}

export function StatIcon({ type, size = 24 }: StatIconProps) {
  const green = '#00ff00';
  const greenBright = '#00ff88';
  
  const renderIcon = () => {
    switch (type) {
      case 'target':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="7" stroke={green} strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="5" stroke={greenBright} strokeWidth="1" fill="none" opacity="0.7" />
            <circle cx="12" cy="12" r="3" stroke={green} strokeWidth="1" fill="none" />
            <line x1="12" y1="4" x2="12" y2="8" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12" y2="20" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="12" x2="8" y2="12" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="12" x2="20" y2="12" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill={greenBright} />
          </svg>
        );
      
      case 'rocket':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 12 2 L 12 8 L 8 10 L 8 14 L 12 16 L 12 22" stroke={green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 12 2 L 16 10 L 16 14 L 12 16" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 8 10 L 16 10" stroke={green} strokeWidth="1" />
            <path d="M 8 14 L 16 14" stroke={green} strokeWidth="1" />
            <circle cx="12" cy="12" r="1.5" fill={greenBright} />
          </svg>
        );
      
      case 'running':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="5" r="3" fill={greenBright} />
            <path d="M 10 8 L 10 16" stroke={green} strokeWidth="2" strokeLinecap="round" />
            <path d="M 10 10 L 6 16" stroke={greenBright} strokeWidth="2" strokeLinecap="round" />
            <path d="M 10 10 L 16 8" stroke={greenBright} strokeWidth="2" strokeLinecap="round" />
            <path d="M 10 16 L 6 22" stroke={green} strokeWidth="2" strokeLinecap="round" />
            <path d="M 10 16 L 14 20" stroke={green} strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="10" x2="20" y2="10" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17" y1="14" x2="19" y2="14" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      
      case 'clock':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke={green} strokeWidth="1.5" fill="none" />
            <line x1="12" y1="6" x2="12" y2="12" stroke={greenBright} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="12" x2="16" y2="12" stroke={green} strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill={greenBright} />
          </svg>
        );
      
      case 'skull':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="10" r="2" fill={greenBright} />
            <circle cx="15" cy="10" r="2" fill={greenBright} />
            <path d="M 12 4 Q 6 6 6 12 Q 6 16 8 18 L 8 20 L 16 20 L 16 18 Q 18 16 18 12 Q 18 6 12 4 Z" stroke={green} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="10" y1="18" x2="14" y2="18" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      
      case 'shield':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 12 2 L 18 5 L 18 11 Q 18 15 12 18 Q 6 15 6 11 L 6 5 Z" stroke={green} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <path d="M 12 4 L 16 6 L 16 11 Q 16 13 12 15 Q 8 13 8 11 L 8 6 Z" stroke={greenBright} strokeWidth="1" fill="none" opacity="0.6" />
            <line x1="12" y1="9" x2="12" y2="13" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="11" x2="14" y2="11" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      
      case 'cubes':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="10" width="4" height="4" stroke={green} strokeWidth="1.5" fill="none" />
            <rect x="10" y="8" width="4" height="4" stroke={greenBright} strokeWidth="1.5" fill="none" />
            <rect x="14" y="10" width="4" height="4" stroke={green} strokeWidth="1.5" fill="none" />
            <line x1="8" y1="10" x2="10" y2="8" stroke={green} strokeWidth="1" />
            <line x1="12" y1="8" x2="14" y2="10" stroke={green} strokeWidth="1" />
            <line x1="10" y1="12" x2="12" y2="12" stroke={green} strokeWidth="1" />
            <line x1="14" y1="12" x2="16" y2="12" stroke={green} strokeWidth="1" />
          </svg>
        );
      
      case 'trophy':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 8 4 L 8 8 L 6 8 L 6 10 L 8 10 L 8 12 Q 8 14 10 14 L 14 14 Q 16 14 16 12 L 16 10 L 18 10 L 18 8 L 16 8 L 16 4 Z" stroke={green} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <rect x="10" y="14" width="4" height="6" stroke={greenBright} strokeWidth="1.5" fill="none" />
            <line x1="7" y1="20" x2="17" y2="20" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      
      case 'accuracy':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="7" stroke={green} strokeWidth="1.5" fill="none" />
            <line x1="12" y1="5" x2="12" y2="19" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill={greenBright} />
          </svg>
        );
      
      case 'biohazard':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" stroke={green} strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="8" r="2" fill={greenBright} />
            <circle cx="9" cy="14" r="2" fill={greenBright} />
            <circle cx="15" cy="14" r="2" fill={greenBright} />
            <path d="M 12 10 L 9 14 M 12 10 L 15 14" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12" y2="18" stroke={greenBright} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {renderIcon()}
    </div>
  );
}

