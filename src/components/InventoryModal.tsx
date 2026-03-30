import { useState, useEffect } from 'react';
import {
    addMiniMe,
    getMiniMeCount,
    getMiniMeCost,
    getMiniMeName,
    getMiniMeDescription,
    getAllMiniMeTypes,
    type MiniMeType,
} from '../services/inventoryService';
import { getAvailableCoins, spendCoins } from '../services/coinService';
import {
    getMiniMeSessionsAvailable,
    buyMiniMeSessionsPack,
    MINI_ME_SESSIONS_PACK_COST,
    MINI_ME_SESSIONS_PACK_SIZE,
} from '../services/miniMeSessionsService';
import { useAccount } from '@starknet-react/core';
import { useDojo } from './DojoContext';
import { purchaseMiniMeUnit, purchaseMiniMeSessions } from '../services/dojoService';
import './InventoryModal.css';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate?: (type: MiniMeType) => void; // Callback when mini-me is activated
    onSessionsChanged?: (newCount: number) => void; // Callback when sessions are bought (so game registry can update)
}

export function InventoryModal({ isOpen, onClose, onActivate, onSessionsChanged }: InventoryModalProps) {
    const { account } = useAccount();
    const { profile, refreshProfile } = useDojo();
    const [coins, setCoins] = useState(getAvailableCoins());
    const [sessions, setSessions] = useState(getMiniMeSessionsAvailable());
    const [selectedType, setSelectedType] = useState<MiniMeType | null>(null);
    const [action, setAction] = useState<'purchase' | 'activate' | 'buySessions' | null>(null);

    // Always prefer on-chain balance when available; fall back to localStorage
    useEffect(() => {
        if (profile?.coins != null) {
            setCoins(Number(profile.coins));
        } else if (isOpen) {
            setCoins(getAvailableCoins());
        }
        if (profile?.mini_me_sessions_purchased != null) {
            setSessions(Number(profile.mini_me_sessions_purchased));
        } else if (isOpen) {
            setSessions(getMiniMeSessionsAvailable());
        }
    }, [profile, isOpen]);

    const handlePurchase = async (type: MiniMeType) => {
        const cost = getMiniMeCost(type);
        if (coins < cost) {
            alert(`Not enough coins! Need ${cost} coins.`);
            return;
        }
        
        if (account) {
            try {
                const typeMap: Record<MiniMeType, number> = {
                    scout: 0,
                    gunner: 1,
                    shield: 2,
                    decoy: 3,
                    collector: 4,
                    stun: 5,
                    healer: 6,
                };
                await purchaseMiniMeUnit(account, typeMap[type]);
                refreshProfile();
                alert(`${getMiniMeName(type)} purchased on-chain!`);
            } catch (err) {
                console.error("Failed to purchase mini-me on-chain:", err);
                alert("On-chain purchase failed.");
            }
        } else {
            if (spendCoins(cost, `mini_me_purchase_${type}`)) {
                if (addMiniMe(type, 1)) {
                    setCoins(getAvailableCoins());
                    alert(`${getMiniMeName(type)} purchased!`);
                } else {
                    alert('Inventory full! Maximum 20 per type.');
                }
            }
        }
    };

    const handleActivate = (type: MiniMeType) => {
        // In-game activation uses 1 session (no coins or inventory)
        if (onActivate) {
            if (sessions <= 0) {
                alert('No mini-me sessions left! Buy more or earn 3 by completing a prestige.');
                return;
            }
            onActivate(type);
            setSessions(getMiniMeSessionsAvailable());
            onClose();
            return;
        }
        alert('Activate mini-mes during a battle from the pause menu.');
    };

    const handleQuickAction = (type: MiniMeType, actionType: 'purchase' | 'activate') => {
        setSelectedType(type);
        setAction(actionType);
    };

    const handleBuySessions = async () => {
        if (coins < MINI_ME_SESSIONS_PACK_COST) {
            alert(`Need ${MINI_ME_SESSIONS_PACK_COST} coins for ${MINI_ME_SESSIONS_PACK_SIZE} sessions.`);
            return;
        }
        if (account) {
            try {
                await purchaseMiniMeSessions(account);
                refreshProfile();
                alert(`Purchased ${MINI_ME_SESSIONS_PACK_SIZE} mini-me sessions on-chain!`);
            } catch (err) {
                console.error("Failed to buy sessions on-chain:", err);
                alert("On-chain purchase failed.");
            }
        } else {
            if (buyMiniMeSessionsPack(coins, spendCoins)) {
                setCoins(getAvailableCoins());
                const newCount = getMiniMeSessionsAvailable();
                setSessions(newCount);
                onSessionsChanged?.(newCount); // Sync to game registry so in-game activation sees new sessions
                alert(`Purchased ${MINI_ME_SESSIONS_PACK_SIZE} mini-me sessions!`);
            }
        }
    };

    const confirmAction = () => {
        if (!selectedType || !action) return;
        
        if (action === 'purchase') {
            handlePurchase(selectedType);
        } else if (action === 'activate') {
            handleActivate(selectedType);
        }
        
        setSelectedType(null);
        setAction(null);
    };

    if (!isOpen) return null;

    const miniMeTypes = getAllMiniMeTypes();

    return (
        <div className="inventory-modal-overlay" onClick={onClose}>
            <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
                <div className="inventory-modal-header">
                    <h2 className="inventory-modal-title">MINI-ME INVENTORY</h2>
                    <button className="inventory-modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                
                <div className="inventory-coin-balance">
                    <span className="inventory-coin-label">Coins:</span>
                    <span className="inventory-coin-value">{coins}</span>
                </div>

                <div className="inventory-sessions-section">
                    <h3 className="inventory-sessions-title">MINI-ME SESSIONS (for battle)</h3>
                    <div className="inventory-sessions-row">
                        <span className="inventory-sessions-label">Sessions left:</span>
                        <span className="inventory-sessions-value">{sessions}</span>
                        <button
                            type="button"
                            className={`inventory-sessions-buy-btn ${coins >= MINI_ME_SESSIONS_PACK_COST ? '' : 'disabled'}`}
                            onClick={(e) => { e.stopPropagation(); handleBuySessions(); }}
                            disabled={coins < MINI_ME_SESSIONS_PACK_COST}
                        >
                            Buy {MINI_ME_SESSIONS_PACK_SIZE} sessions for {MINI_ME_SESSIONS_PACK_COST} coins
                        </button>
                    </div>
                    <p className="inventory-sessions-hint">Use sessions in battle (M key) or earn +3 per prestige.</p>
                </div>

                <div className="inventory-grid">
                    {miniMeTypes.map((type) => {
                        const count = getMiniMeCount(type);
                        const cost = getMiniMeCost(type);
                        const canBuy = coins >= cost;
                        const canAct = !!onActivate && sessions > 0;
                        
                        return (
                            <div key={type} className="inventory-item">
                                <div className="inventory-item-header">
                                    <h3 className="inventory-item-name">{getMiniMeName(type)}</h3>
                                    <span className="inventory-item-count">x{count}</span>
                                </div>
                                
                                <div className="inventory-item-icon">
                                    {/* Placeholder for mini-me icon */}
                                    <div className="inventory-item-placeholder">
                                        {type.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                
                                <p className="inventory-item-description">
                                    {getMiniMeDescription(type)}
                                </p>
                                
                                <div className="inventory-item-cost">
                                    Cost: {cost} coins
                                </div>
                                
                                <div className="inventory-item-actions">
                                    <button
                                        className={`inventory-action-btn inventory-action-btn-purchase ${canBuy ? '' : 'disabled'}`}
                                        onClick={() => handleQuickAction(type, 'purchase')}
                                        disabled={!canBuy}
                                    >
                                        Purchase
                                    </button>
                                    <button
                                        className={`inventory-action-btn inventory-action-btn-activate ${canAct ? '' : 'disabled'}`}
                                        onClick={() => handleQuickAction(type, 'activate')}
                                        disabled={!canAct}
                                    >
                                        Activate
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedType && action && action !== 'buySessions' && (
                    <div className="inventory-confirmation-overlay">
                        <div className="inventory-confirmation">
                            <h3>Confirm {action === 'purchase' ? 'Purchase' : 'Activation'}</h3>
                            <p>
                                {action === 'purchase'
                                    ? `Purchase ${getMiniMeName(selectedType)} for ${getMiniMeCost(selectedType)} coins?`
                                    : `Use 1 session to deploy ${getMiniMeName(selectedType)} for 15 seconds?`}
                            </p>
                            <div className="inventory-confirmation-actions">
                                <button onClick={confirmAction} className="inventory-confirm-btn">
                                    Confirm
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedType(null);
                                        setAction(null);
                                    }}
                                    className="inventory-cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
