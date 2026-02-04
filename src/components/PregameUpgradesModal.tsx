import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAllPregameUpgrades,
    getTotalPregameCost,
    type PregameUpgradeId,
} from "../services/pregameUpgradeService";
import { getAvailableCoins, spendCoins } from "../services/coinService";
import "./PregameUpgradesModal.css";

interface PregameUpgradesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PregameUpgradesModal({
    isOpen,
    onClose,
}: PregameUpgradesModalProps) {
    const navigate = useNavigate();
    const [coins, setCoins] = useState(getAvailableCoins());
    const [selected, setSelected] = useState<Set<PregameUpgradeId>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setCoins(getAvailableCoins());
        }
    }, [isOpen]);

    const upgrades = getAllPregameUpgrades();
    const totalCost = getTotalPregameCost(Array.from(selected));
    const canAfford = coins >= totalCost;

    const handleLaunch = () => {
        const ids = Array.from(selected);
        if (ids.length > 0 && !spendCoins(totalCost, "pregame_upgrades")) {
            return;
        }
        if (ids.length > 0) setCoins(getAvailableCoins());
        onClose();
        navigate("/play", { state: { pregameUpgrades: ids } });
    };

    const handleSkip = () => {
        onClose();
        navigate("/play", { state: { pregameUpgrades: [] } });
    };

    if (!isOpen) return null;

    return (
        <div className="pregame-modal-overlay" onClick={onClose}>
            <div className="pregame-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pregame-modal-header">
                    <h2 className="pregame-modal-title">GEAR UP</h2>
                    <button
                        type="button"
                        className="pregame-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                <p className="pregame-modal-subtitle">
                    Session upgrades — last this run only. Buy again next game.
                </p>
                <div className="pregame-coin-row">
                    <span className="pregame-coin-label">Coins:</span>
                    <span className="pregame-coin-value">{coins}</span>
                </div>
                <div className="pregame-upgrades-grid">
                    {upgrades.map((u) => {
                        const isSelected = selected.has(u.id);
                        const affordable = coins >= u.cost;
                        return (
                            <button
                                key={u.id}
                                type="button"
                                className={`pregame-upgrade-card ${isSelected ? "selected" : ""} ${!affordable && !isSelected ? "disabled" : ""}`}
                                onClick={() => {
                                    if (isSelected) {
                                        setSelected((s) => {
                                            const n = new Set(s);
                                            n.delete(u.id);
                                            return n;
                                        });
                                    } else if (affordable) {
                                        setSelected((s) => new Set(s).add(u.id));
                                    }
                                }}
                                disabled={!isSelected && !affordable}
                            >
                                <span className="pregame-upgrade-name">{u.name}</span>
                                <span className="pregame-upgrade-desc">{u.description}</span>
                                <span className="pregame-upgrade-cost">{u.cost} coins</span>
                            </button>
                        );
                    })}
                </div>
                <div className="pregame-total-row">
                    <span className="pregame-total-label">Total:</span>
                    <span className="pregame-total-value">{totalCost} coins</span>
                </div>
                <div className="pregame-actions">
                    <button
                        type="button"
                        className="pregame-btn pregame-btn-skip"
                        onClick={handleSkip}
                    >
                        Skip — Start without upgrades
                    </button>
                    <button
                        type="button"
                        className="pregame-btn pregame-btn-launch"
                        onClick={handleLaunch}
                        disabled={selected.size > 0 && !canAfford}
                    >
                        Launch {selected.size > 0 ? `(${totalCost} coins)` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
}
