import { useState, useEffect } from 'react';
import {
    addMiniMe,
    useMiniMe,
    getMiniMeCount,
    canActivate,
    getMiniMeCost,
    getMiniMeName,
    getMiniMeDescription,
    getAllMiniMeTypes,
    type MiniMeType,
} from '../services/inventoryService';
import { getAvailableCoins, spendCoins } from '../services/coinService';
import './InventoryModal.css';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate?: (type: MiniMeType) => void; // Callback when mini-me is activated
}

export function InventoryModal({ isOpen, onClose, onActivate }: InventoryModalProps) {
    const [coins, setCoins] = useState(getAvailableCoins());
    const [selectedType, setSelectedType] = useState<MiniMeType | null>(null);
    const [action, setAction] = useState<'purchase' | 'activate' | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCoins(getAvailableCoins());
        }
    }, [isOpen]);

    const handlePurchase = (type: MiniMeType) => {
        const cost = getMiniMeCost(type);
        if (coins < cost) {
            alert(`Not enough coins! Need ${cost} coins.`);
            return;
        }
        
        if (spendCoins(cost, `mini_me_purchase_${type}`)) {
            if (addMiniMe(type, 1)) {
                setCoins(getAvailableCoins());
                alert(`${getMiniMeName(type)} purchased!`);
            } else {
                alert('Inventory full! Maximum 20 per type.');
            }
        }
    };

    const handleActivate = (type: MiniMeType) => {
        const cost = getMiniMeCost(type);
        if (!canActivate(type, coins)) {
            alert(`Cannot activate! Need ${cost} coins and at least 1 in inventory.`);
            return;
        }
        
        if (spendCoins(cost, `mini_me_activate_${type}`)) {
            if (useMiniMe(type, 1)) {
                setCoins(getAvailableCoins());
                if (onActivate) {
                    onActivate(type);
                }
                onClose();
            }
        }
    };

    const handleQuickAction = (type: MiniMeType, actionType: 'purchase' | 'activate') => {
        setSelectedType(type);
        setAction(actionType);
    };

    const confirmAction = () => {
        if (!selectedType || !action) return;
        
        if (action === 'purchase') {
            handlePurchase(selectedType);
        } else {
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

                <div className="inventory-grid">
                    {miniMeTypes.map((type) => {
                        const count = getMiniMeCount(type);
                        const cost = getMiniMeCost(type);
                        const canBuy = coins >= cost;
                        const canAct = canActivate(type, coins);
                        
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
                                        className={`inventory-action-btn ${canBuy ? '' : 'disabled'}`}
                                        onClick={() => handleQuickAction(type, 'purchase')}
                                        disabled={!canBuy}
                                    >
                                        Purchase
                                    </button>
                                    <button
                                        className={`inventory-action-btn ${canAct ? '' : 'disabled'}`}
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

                {selectedType && action && (
                    <div className="inventory-confirmation-overlay">
                        <div className="inventory-confirmation">
                            <h3>Confirm {action === 'purchase' ? 'Purchase' : 'Activation'}</h3>
                            <p>
                                {action === 'purchase'
                                    ? `Purchase ${getMiniMeName(selectedType)} for ${getMiniMeCost(selectedType)} coins?`
                                    : `Activate ${getMiniMeName(selectedType)} for ${getMiniMeCost(selectedType)} coins?`}
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
