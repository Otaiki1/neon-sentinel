import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import {
    getAllPregameUpgrades,
    getTotalPregameCost,
    type PregameUpgradeId,
} from "../services/pregameUpgradeService";
import { getAvailableCoins, spendCoins } from "../services/coinService";
import { initGame as initGameOnChain } from "../services/dojoService";
import { RpcProvider } from "starknet";
import { DOJO_SEPOLIA } from "../dojo/config";
import { useDojo } from "./DojoContext";
import "./PregameUpgradesModal.css";

const TWO_POW_64 = 18446744073709551616n; // 2n ** 64n

/**
 * Replicates the contract's compute_run_seed to derive the run_id locally.
 * run_id.low = (block_number + block_timestamp * 2^64) mod 2^128
 * run_id.high = 0
 * Returns a hex string matching what Torii/the contract stores.
 */
async function computeRunId(blockNumber: bigint): Promise<string> {
    const provider = new RpcProvider({ nodeUrl: DOJO_SEPOLIA.rpcUrl });
    const block = await provider.getBlockWithTxs(Number(blockNumber));
    const blockTimestamp = BigInt(block.timestamp);
    const TWO_POW_128 = 2n ** 128n;
    const low = (blockNumber + blockTimestamp * TWO_POW_64) % TWO_POW_128;
    return "0x" + low.toString(16).padStart(64, "0");
}

interface PregameUpgradesModalProps {
    isOpen: boolean;
    onClose: () => void;
    kernel: number;
}

export function PregameUpgradesModal({
    isOpen,
    onClose,
    kernel,
}: PregameUpgradesModalProps) {
    const navigate = useNavigate();
    const { account, address } = useAccount();
    const { profile } = useDojo();
    const [coins, setCoins] = useState(getAvailableCoins());
    const [selected, setSelected] = useState<Set<PregameUpgradeId>>(new Set());
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
        if (profile?.coins != null) {
            setCoins(Number(profile.coins));
        }
    }, [profile]);

    const upgrades = getAllPregameUpgrades();
    const totalCost = getTotalPregameCost(Array.from(selected));
    const canAfford = coins >= totalCost;

    const startOnChainRun = async (ids: PregameUpgradeId[]) => {
        if (!account || !address) return false;
        
        const bitById: Record<PregameUpgradeId, number> = {
            extra_health_1: 0,
            extra_health_2: 1,
            max_health_6: 2,
            gun_power: 3,
            fire_rate: 4,
            powerup_duration: 5,
            movement_speed: 6,
        };

        let mask = 0n;
        for (const id of ids) {
            mask |= 1n << BigInt(bitById[id]);
        }

        const cost = getTotalPregameCost(ids);
        
        try {
            setIsLaunching(true);
            const { transaction_hash } = await initGameOnChain(account, kernel, mask, cost);
            console.log("Transaction sent:", transaction_hash);
            // Wait for tx acceptance, receipt contains block_number
            const receipt = await account.waitForTransaction(transaction_hash);
            // Deterministically compute run_id from block data (mirrors contract's compute_run_seed)
            const blockNumber = BigInt((receipt as any).block_number ?? 0n);
            if (blockNumber > 0n) {
                try {
                    const runId = await computeRunId(blockNumber);
                    sessionStorage.setItem("activeRunId", runId);
                    console.log("[OnChain] Run ID computed from block", blockNumber.toString(), "->", runId);
                } catch (computeErr) {
                    console.warn("[OnChain] Could not compute run_id:", computeErr);
                    sessionStorage.removeItem("activeRunId");
                }
            } else {
                console.warn("[OnChain] No block_number in receipt, run_id unknown.");
                sessionStorage.removeItem("activeRunId");
            }
            return true;
        } catch (e) {
            console.error("Failed to init_game on-chain:", e);
            alert("Failed to initialize on-chain run. Please check your wallet.");
            return false;
        } finally {
            setIsLaunching(false);
        }
    };

    const handleLaunch = async () => {
        const ids = Array.from(selected);

        // If wallet is connected, let the contract deduct coins and start the run.
        if (account && address) {
            const success = await startOnChainRun(ids);
            if (!success) return;

            onClose();
            navigate("/play", { state: { pregameUpgrades: ids } });
            return;
        }

        // Anonymous / local mode (legacy)
        if (ids.length > 0 && !spendCoins(totalCost, "pregame_upgrades")) return;
        if (ids.length > 0) setCoins(getAvailableCoins());
        onClose();
        navigate("/play", { state: { pregameUpgrades: ids } });
    };

    const handleSkip = async () => {
        if (account && address) {
            const success = await startOnChainRun([]);
            if (!success) return;
        }
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
                        disabled={isLaunching}
                    >
                        {isLaunching && selected.size === 0 ? "SKIPPING..." : "Skip — Start without upgrades"}
                    </button>
                    <button
                        type="button"
                        className="pregame-btn pregame-btn-launch"
                        onClick={handleLaunch}
                        disabled={(selected.size > 0 && !canAfford) || isLaunching}
                    >
                        {isLaunching && selected.size > 0 ? "LAUNCHING..." : `Launch ${selected.size > 0 ? `(${totalCost} coins)` : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
