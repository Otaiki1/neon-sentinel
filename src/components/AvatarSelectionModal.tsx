import { useState, useEffect } from 'react';
import { 
    getAllAvatarsWithStatus, 
    purchaseAvatar, 
    setActiveAvatar, 
    getActiveAvatar,
    type AvatarId 
} from '../services/avatarService';
import { getAvailableCoins } from '../services/coinService';
import './AvatarSelectionModal.css';

interface AvatarSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAvatarChange?: () => void;
}

export default function AvatarSelectionModal({ 
    isOpen, 
    onClose,
    onAvatarChange 
}: AvatarSelectionModalProps) {
    const [avatars, setAvatars] = useState<ReturnType<typeof getAllAvatarsWithStatus>>([]);
    const [activeAvatarId, setActiveAvatarId] = useState<AvatarId>(getActiveAvatar());
    const [coins, setCoins] = useState(getAvailableCoins());
    const [prestigeLevel, setPrestigeLevel] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Prestige level would need to be tracked separately or derived from stats
            // For now, assume 0 - this should be updated to track actual prestige
            const currentPrestige = 0; // TODO: Get from prestige tracking
            
            setPrestigeLevel(currentPrestige);
            setAvatars(getAllAvatarsWithStatus(currentPrestige));
            setActiveAvatarId(getActiveAvatar());
            setCoins(getAvailableCoins());
        }
    }, [isOpen]);

    const handlePurchase = (avatarId: AvatarId, cost: number) => {
        if (coins < cost) {
            alert(`Not enough coins! You need ${cost} coins.`);
            return;
        }
        
        const success = purchaseAvatar(avatarId);
        if (success) {
            setAvatars(getAllAvatarsWithStatus(prestigeLevel));
            setCoins(getAvailableCoins());
            if (onAvatarChange) {
                onAvatarChange();
            }
        } else {
            alert('Failed to purchase avatar. Please try again.');
        }
    };

    const handleSelect = (avatarId: AvatarId) => {
        const success = setActiveAvatar(avatarId);
        if (success) {
            setActiveAvatarId(avatarId);
            if (onAvatarChange) {
                onAvatarChange();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="avatar-modal-overlay" onClick={onClose}>
            <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="avatar-modal-header">
                    <h2 className="font-menu text-xl text-neon-green">SELECT AVATAR</h2>
                    <button 
                        className="avatar-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                
                <div className="avatar-modal-coins">
                    <span className="font-body text-sm text-neon-green">
                        Available Coins: <span className="text-yellow-400">{coins}</span>
                    </span>
                </div>

                <div className="avatar-modal-grid">
                    {avatars.map(({ id, config, isPurchased, canAfford }) => {
                        const isActive = activeAvatarId === id;
                        const isLocked = config.unlockPrestige > prestigeLevel;
                        
                        return (
                            <div 
                                key={id}
                                className={`avatar-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                            >
                                <div className="avatar-card-image">
                                    {isLocked ? (
                                        <div className="avatar-locked-icon">🔒</div>
                                    ) : (
                                        <img 
                                            src={`/sprites/${config.spriteKey}.svg`}
                                            alt={config.name}
                                            className="avatar-sprite"
                                            onError={(e) => {
                                                // Fallback to default hero sprite
                                                (e.target as HTMLImageElement).src = '/sprites/hero.svg';
                                            }}
                                        />
                                    )}
                                </div>
                                
                                <div className="avatar-card-info">
                                    <h3 className="font-menu text-sm text-neon-green">
                                        {config.displayName}
                                    </h3>
                                    <p className="font-body text-xs text-neon-green opacity-70">
                                        {config.description}
                                    </p>
                                    
                                    <div className="avatar-stats">
                                        <div className="stat-item">
                                            <span>Speed:</span>
                                            <span className={config.stats.speedMult >= 1 ? 'text-green-400' : 'text-red-400'}>
                                                {config.stats.speedMult >= 1 ? '+' : ''}
                                                {Math.round((config.stats.speedMult - 1) * 100)}%
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Fire Rate:</span>
                                            <span className={config.stats.fireRateMult >= 1 ? 'text-green-400' : 'text-red-400'}>
                                                {config.stats.fireRateMult >= 1 ? '+' : ''}
                                                {Math.round((config.stats.fireRateMult - 1) * 100)}%
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Health:</span>
                                            <span className={config.stats.healthMult >= 1 ? 'text-green-400' : 'text-red-400'}>
                                                {config.stats.healthMult >= 1 ? '+' : ''}
                                                {Math.round((config.stats.healthMult - 1) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isLocked ? (
                                        <div className="avatar-unlock-requirement">
                                            <span className="font-body text-xs text-red-500">
                                                Requires Prestige {config.unlockPrestige}
                                            </span>
                                        </div>
                                    ) : !isPurchased ? (
                                        <div className="avatar-purchase-info">
                                            <span className="font-body text-xs text-yellow-400">
                                                {config.unlockCostCoins} coins
                                            </span>
                                            <button
                                                className={`avatar-purchase-btn ${canAfford ? '' : 'disabled'}`}
                                                onClick={() => handlePurchase(id, config.unlockCostCoins)}
                                                disabled={!canAfford}
                                            >
                                                {canAfford ? 'PURCHASE' : 'INSUFFICIENT COINS'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className={`avatar-select-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => handleSelect(id)}
                                        >
                                            {isActive ? 'SELECTED' : 'SELECT'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
