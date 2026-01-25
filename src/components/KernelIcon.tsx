interface KernelIconProps {
  type: 'standard' | 'swift' | 'artillery' | 'sniper' | 'guardian';
  label: string;
  description?: string;
  isSelected?: boolean;
  isUnlocked?: boolean;
  unlockCondition?: string;
  onClick?: () => void;
}

export function KernelIcon({ 
  type, 
  label, 
  description,
  isSelected = false,
  isUnlocked = true,
  unlockCondition,
  onClick 
}: KernelIconProps) {
  const renderIcon = () => {
    const green = '#00ff00';
    const greenBright = '#00ff88';
    const greenDim = '#00aa00';
    
    switch (type) {
      case 'standard':
        return (
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-standard">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Outer target ring */}
            <circle cx="60" cy="60" r="38" stroke={green} strokeWidth="2.5" fill="none" opacity="0.8" filter="url(#glow-standard)" />
            <circle cx="60" cy="60" r="32" stroke={greenBright} strokeWidth="2" fill="none" opacity="0.9" />
            <circle cx="60" cy="60" r="26" stroke={green} strokeWidth="2" fill="none" />
            <circle cx="60" cy="60" r="18" stroke={greenBright} strokeWidth="1.5" fill="none" opacity="0.7" />
            {/* Crosshair lines - thicker and more prominent */}
            <line x1="60" y1="15" x2="60" y2="42" stroke={green} strokeWidth="3" strokeLinecap="round" filter="url(#glow-standard)" />
            <line x1="60" y1="78" x2="60" y2="105" stroke={green} strokeWidth="3" strokeLinecap="round" filter="url(#glow-standard)" />
            <line x1="15" y1="60" x2="42" y2="60" stroke={green} strokeWidth="3" strokeLinecap="round" filter="url(#glow-standard)" />
            <line x1="78" y1="60" x2="105" y2="60" stroke={green} strokeWidth="3" strokeLinecap="round" filter="url(#glow-standard)" />
            {/* Center dot with glow */}
            <circle cx="60" cy="60" r="5" fill={greenBright} filter="url(#glow-standard)" />
            <circle cx="60" cy="60" r="3" fill={green} />
            {/* Bullet projectile - more detailed */}
            <g transform="translate(78, 28)">
              <ellipse cx="0" cy="0" rx="4" ry="8" fill={greenBright} opacity="0.9" />
              <rect x="-4" y="0" width="8" height="14" fill={green} />
              <rect x="-3" y="14" width="6" height="4" fill={greenDim} />
              <line x1="-2" y1="2" x2="2" y2="2" stroke={greenDim} strokeWidth="0.5" />
              <line x1="-2" y1="6" x2="2" y2="6" stroke={greenDim} strokeWidth="0.5" />
            </g>
          </svg>
        );
      
      case 'swift':
        return (
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-swift">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Running figure - more dynamic */}
            <g transform="translate(50, 32)">
              {/* Head with glow */}
              <circle cx="10" cy="6" r="6" fill={greenBright} filter="url(#glow-swift)" />
              <circle cx="10" cy="6" r="4" fill={green} />
              {/* Body - thicker */}
              <path d="M 10 12 L 10 32" stroke={green} strokeWidth="4" strokeLinecap="round" filter="url(#glow-swift)" />
              {/* Arms - more dynamic running pose */}
              <path d="M 10 16 L 3 28" stroke={greenBright} strokeWidth="4" strokeLinecap="round" filter="url(#glow-swift)" />
              <path d="M 10 16 L 22 8" stroke={greenBright} strokeWidth="4" strokeLinecap="round" filter="url(#glow-swift)" />
              {/* Legs - running stride */}
              <path d="M 10 32 L 2 48" stroke={green} strokeWidth="4" strokeLinecap="round" filter="url(#glow-swift)" />
              <path d="M 10 32 L 20 42" stroke={green} strokeWidth="4" strokeLinecap="round" filter="url(#glow-swift)" />
            </g>
            {/* Speed lines - more prominent and varied */}
            <g opacity="0.8">
              <line x1="72" y1="42" x2="92" y2="40" stroke={greenBright} strokeWidth="3" strokeLinecap="round" filter="url(#glow-swift)" />
              <line x1="70" y1="52" x2="88" y2="50" stroke={green} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-swift)" />
              <line x1="74" y1="62" x2="95" y2="60" stroke={greenBright} strokeWidth="3" strokeLinecap="round" filter="url(#glow-swift)" />
              <line x1="68" y1="72" x2="90" y2="70" stroke={green} strokeWidth="2" strokeLinecap="round" filter="url(#glow-swift)" />
            </g>
            {/* Motion blur effect */}
            <ellipse cx="75" cy="55" rx="15" ry="25" fill={green} opacity="0.1" />
          </svg>
        );
      
      case 'artillery':
        return (
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-artillery">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Artillery shell - more detailed and prominent */}
            <g transform="translate(48, 28)">
              {/* Shell body with gradient effect */}
              <path d="M 12 0 L 20 0 L 20 42 L 12 42 Z" fill={green} opacity="0.9" />
              <path d="M 12 0 L 20 0 L 20 42 L 12 42 Z" fill="none" stroke={greenBright} strokeWidth="1.5" />
              {/* Shell tip - sharper */}
              <path d="M 12 0 L 16 -12 L 20 0 Z" fill={greenBright} filter="url(#glow-artillery)" />
              <path d="M 12 0 L 16 -8 L 20 0 Z" fill={green} />
              {/* Shell base - more detailed */}
              <rect x="10" y="42" width="12" height="10" fill={greenDim} />
              <rect x="11" y="42" width="10" height="8" fill={green} opacity="0.7" />
              {/* Detail lines - more prominent */}
              <line x1="12" y1="14" x2="20" y2="14" stroke={greenBright} strokeWidth="1.5" />
              <line x1="12" y1="28" x2="20" y2="28" stroke={greenBright} strokeWidth="1.5" />
              <circle cx="16" cy="21" r="1.5" fill={greenBright} />
            </g>
            {/* Trajectory arc - more visible */}
            <path d="M 68 42 Q 85 28 98 52" stroke={greenBright} strokeWidth="3" fill="none" strokeDasharray="4 4" filter="url(#glow-artillery)" opacity="0.9" />
            <path d="M 68 42 Q 85 28 98 52" stroke={green} strokeWidth="1.5" fill="none" strokeDasharray="2 2" opacity="0.6" />
            {/* Explosion particles - more dramatic */}
            <g opacity="0.9">
              <circle cx="96" cy="54" r="3" fill={greenBright} filter="url(#glow-artillery)" />
              <circle cx="100" cy="50" r="2.5" fill={green} filter="url(#glow-artillery)" />
              <circle cx="93" cy="58" r="2.5" fill={green} filter="url(#glow-artillery)" />
              <circle cx="102" cy="56" r="2" fill={greenBright} filter="url(#glow-artillery)" />
              <circle cx="94" cy="52" r="2" fill={greenBright} filter="url(#glow-artillery)" />
            </g>
          </svg>
        );
      
      case 'sniper':
        return (
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-sniper">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Outer scope ring - thicker */}
            <circle cx="60" cy="60" r="32" stroke={green} strokeWidth="3" fill="none" filter="url(#glow-sniper)" />
            <circle cx="60" cy="60" r="28" stroke={greenBright} strokeWidth="2" fill="none" opacity="0.8" />
            {/* Main crosshair - bold */}
            <line x1="60" y1="22" x2="60" y2="98" stroke={green} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-sniper)" />
            <line x1="22" y1="60" x2="98" y2="60" stroke={green} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-sniper)" />
            {/* Inner rings - more defined */}
            <circle cx="60" cy="60" r="22" stroke={greenBright} strokeWidth="1.5" fill="none" opacity="0.7" />
            <circle cx="60" cy="60" r="12" stroke={green} strokeWidth="1.5" fill="none" opacity="0.6" />
            {/* Mil-dots - more visible */}
            <g opacity="0.9">
              <circle cx="60" cy="38" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="60" cy="48" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="60" cy="72" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="60" cy="82" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="38" cy="60" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="48" cy="60" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="72" cy="60" r="2" fill={greenBright} filter="url(#glow-sniper)" />
              <circle cx="82" cy="60" r="2" fill={greenBright} filter="url(#glow-sniper)" />
            </g>
            {/* Center dot - prominent */}
            <circle cx="60" cy="60" r="3.5" fill={greenBright} filter="url(#glow-sniper)" />
            <circle cx="60" cy="60" r="2" fill={green} />
            {/* Range finder marks - more visible */}
            <g opacity="0.8">
              <line x1="94" y1="54" x2="98" y2="54" stroke={greenBright} strokeWidth="2" strokeLinecap="round" filter="url(#glow-sniper)" />
              <line x1="94" y1="60" x2="100" y2="60" stroke={green} strokeWidth="3" strokeLinecap="round" filter="url(#glow-sniper)" />
              <line x1="94" y1="66" x2="98" y2="66" stroke={greenBright} strokeWidth="2" strokeLinecap="round" filter="url(#glow-sniper)" />
            </g>
            {/* Scope details */}
            <rect x="25" y="55" width="8" height="10" stroke={green} strokeWidth="1.5" fill="none" opacity="0.6" />
          </svg>
        );

      case 'guardian':
        return (
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-guardian">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Shield - more prominent and detailed */}
            <path d="M 60 18 L 88 30 L 88 72 Q 88 88 60 98 Q 32 88 32 72 L 32 30 Z" 
                  stroke={green} strokeWidth="3" fill="none" filter="url(#glow-guardian)" />
            <path d="M 60 18 L 88 30 L 88 72 Q 88 88 60 98 Q 32 88 32 72 L 32 30 Z" 
                  stroke={greenBright} strokeWidth="1.5" fill="none" opacity="0.6" />
            {/* Shield inner structure */}
            <path d="M 60 28 L 80 35 L 80 67 Q 80 78 60 83 Q 40 78 40 67 L 40 35 Z" 
                  stroke={greenBright} strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M 60 28 L 80 35 L 80 67 Q 80 78 60 83 Q 40 78 40 67 L 40 35 Z" 
                  stroke={green} strokeWidth="1" fill="none" opacity="0.4" />
            {/* Cross in center - bold */}
            <line x1="60" y1="48" x2="60" y2="72" stroke={greenBright} strokeWidth="3.5" strokeLinecap="round" filter="url(#glow-guardian)" />
            <line x1="48" y1="60" x2="72" y2="60" stroke={greenBright} strokeWidth="3.5" strokeLinecap="round" filter="url(#glow-guardian)" />
            <line x1="60" y1="48" x2="60" y2="72" stroke={green} strokeWidth="2" strokeLinecap="round" />
            <line x1="48" y1="60" x2="72" y2="60" stroke={green} strokeWidth="2" strokeLinecap="round" />
            {/* Reinforcement bars - more visible */}
            <line x1="60" y1="33" x2="60" y2="43" stroke={greenBright} strokeWidth="2" strokeLinecap="round" filter="url(#glow-guardian)" />
            <line x1="50" y1="38" x2="70" y2="38" stroke={greenBright} strokeWidth="2" strokeLinecap="round" filter="url(#glow-guardian)" />
            {/* Shield edge highlights */}
            <path d="M 60 18 L 88 30" stroke={greenBright} strokeWidth="2" fill="none" opacity="0.8" />
            <path d="M 60 18 L 32 30" stroke={greenBright} strokeWidth="2" fill="none" opacity="0.8" />
          </svg>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isUnlocked}
      className={`group relative flex flex-col items-center justify-center p-2 md:p-3 transition-all duration-200 w-full ${
        isUnlocked
          ? isSelected
            ? 'border-2 border-neon-green bg-black bg-opacity-80'
            : 'border-2 border-neon-green border-opacity-40 hover:border-opacity-100 hover:bg-black hover:bg-opacity-30'
          : 'border-2 border-gray-600 border-opacity-40 cursor-not-allowed opacity-50'
      }`}
    >
      {/* Icon container - larger to fill more space */}
      <div className="relative w-full flex items-center justify-center mb-2" style={{ minHeight: '80px', maxHeight: '100px' }}>
        <div className="w-[90%] h-full flex items-center justify-center">
          {renderIcon()}
        </div>
      </div>
      
      {/* Kernel name - always visible */}
      <div className="font-menu text-xs md:text-sm text-neon-green text-center px-1 mb-1">
        {label}
      </div>
      
      {/* Status text - always visible */}
      <div className="font-body text-[10px] text-neon-green opacity-50 text-center">
        {isUnlocked ? (isSelected ? 'SELECTED' : 'UNLOCKED') : `LOCKED`}
      </div>
      
      {/* Hover tooltip with description only */}
      {description && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-black border border-neon-green px-3 py-2 text-center shadow-lg whitespace-normal max-w-[200px]" style={{ boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
            <div className="font-body text-xs text-neon-green opacity-80">
              {description}
            </div>
            {!isUnlocked && unlockCondition && (
              <div className="font-body text-[10px] text-neon-green opacity-50 mt-1">
                {unlockCondition}
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neon-green"></div>
          </div>
        </div>
      )}
    </button>
  );
}

