import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import { useDojo } from "./DojoContext";
import {
    answerGauntlet,
    weiToStrk,
    type GauntletBeacon,
} from "../services/gauntletService";
import { waitForTransaction } from "../services/dojoService";
import { DOJO_SEPOLIA } from "../dojo/config";
import "./GauntletModal.css";
import "./ThrowGauntletModal.css";

const TWO_POW_64 = 18446744073709551616n;

/**
 * Replicates the contract's compute_run_seed to derive run_id locally.
 * run_id.low = (block_number + block_timestamp * 2^64) mod 2^128
 */
async function computeRunId(blockNumber: bigint): Promise<string> {
    const provider = new RpcProvider({ nodeUrl: DOJO_SEPOLIA.rpcUrl });
    const block = await provider.getBlockWithTxs(Number(blockNumber));
    const blockTimestamp = BigInt(block.timestamp);
    const TWO_POW_128 = 2n ** 128n;
    const low = (blockNumber + blockTimestamp * TWO_POW_64) % TWO_POW_128;
    return "0x" + low.toString(16).padStart(64, "0");
}

// Kernel options (mirrors init_game)
const KERNELS = [
    { id: 1, name: "ALPHA" },
    { id: 2, name: "BETA" },
    { id: 3, name: "GAMMA" },
];

interface AnswerGauntletModalProps {
    isOpen: boolean;
    beacon: GauntletBeacon;
    onClose: () => void;
}

export function AnswerGauntletModal({ isOpen, beacon, onClose }: AnswerGauntletModalProps) {
    const navigate = useNavigate();
    const { account, address } = useAccount();
    const { showTx, hideTx } = useDojo();

    const [kernel, setKernel] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const challengerStakeWei = BigInt(beacon.challenger_stake_required);
    const sentinelStake = weiToStrk(beacon.sentinel_stake);
    const challengerStakeDisplay = weiToStrk(challengerStakeWei);

    const isSelf = address?.toLowerCase() === beacon.sentinel_address.toLowerCase();

    const handleAnswer = async () => {
        if (!account || !address) return;
        setError("");
        setLoading(true);
        showTx("Entering the Gauntlet… staking STRK…");

        try {
            const result = await answerGauntlet(
                account,
                beacon.beacon_id,
                challengerStakeWei,
                kernel,
                0n, // no pregame upgrades for gauntlet (cost validation in contract)
                0,
            );
            await waitForTransaction(result.transaction_hash);

            // Compute run_id from the tx block (mirrors init_game pattern)
            const provider = new RpcProvider({ nodeUrl: DOJO_SEPOLIA.rpcUrl });
            let runId: string | null = null;
            try {
                const receipt = await provider.getTransactionReceipt(result.transaction_hash);
                const blockNumber = BigInt((receipt as any).block_number ?? 0n);
                if (blockNumber > 0n) {
                    runId = await computeRunId(blockNumber);
                }
            } catch {
                // Non-fatal: GameScene will query Torii as fallback
            }

            // Store gauntlet context for GameScene
            if (runId) sessionStorage.setItem("activeRunId", runId);
            sessionStorage.setItem("gauntletBeaconId", beacon.beacon_id);
            sessionStorage.setItem("isGauntletRun", "true");

            hideTx();
            onClose();
            navigate("/play", { state: { pregameUpgrades: [] } });
        } catch (e: any) {
            hideTx();
            setError(e?.message ?? "Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="gauntlet-modal-overlay" onClick={onClose}>
            <div className="gauntlet-modal" onClick={(e) => e.stopPropagation()}>
                <div className="gauntlet-modal-header">
                    <div>
                        <h2 className="gauntlet-modal-title">Answer the Gauntlet</h2>
                        <p className="gauntlet-modal-subtitle">
                            Beat the sentinel's score to claim their stake.
                        </p>
                    </div>
                    <button className="gauntlet-modal-close" onClick={onClose}>×</button>
                </div>

                {/* Beacon info */}
                <div className="tg-summary" style={{ marginBottom: "1.25rem" }}>
                    <div className="tg-summary-row">
                        <span className="tg-summary-label">Sentinel</span>
                        <span className="tg-summary-value" style={{ fontSize: "0.75rem" }}>
                            {beacon.sentinel_address.slice(0, 8)}…{beacon.sentinel_address.slice(-6)}
                        </span>
                    </div>
                    <div className="tg-summary-row">
                        <span className="tg-summary-label">Score to beat</span>
                        <span className="tg-summary-value">{Number(beacon.target_score).toLocaleString()} pts</span>
                    </div>
                    <div className="tg-summary-row">
                        <span className="tg-summary-label">Win prize</span>
                        <span className="tg-summary-value strk">{sentinelStake} STRK</span>
                    </div>
                    <div className="tg-summary-row">
                        <span className="tg-summary-label">Your stake (at risk)</span>
                        <span className="tg-summary-value strk">{challengerStakeDisplay} STRK</span>
                    </div>
                    <div className="tg-summary-row">
                        <span className="tg-summary-label">Expires at block</span>
                        <span className="tg-summary-value">#{Number(beacon.expires_at_block).toLocaleString()}</span>
                    </div>
                </div>

                {isSelf && (
                    <p className="gauntlet-error">You cannot challenge your own gauntlet.</p>
                )}

                {!address && (
                    <p style={{ color: "#888", textAlign: "center", padding: "1rem 0" }}>
                        Connect your wallet to accept.
                    </p>
                )}

                {address && !isSelf && (
                    <div className="tg-form">
                        {/* Kernel selection */}
                        <div className="tg-field">
                            <label className="tg-label">Choose your kernel</label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {KERNELS.map((k) => (
                                    <button
                                        key={k.id}
                                        type="button"
                                        className={`gauntlet-btn ${kernel === k.id ? "gauntlet-btn-primary" : "gauntlet-btn-muted"}`}
                                        onClick={() => setKernel(k.id)}
                                    >
                                        {k.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="tg-hint" style={{ color: "#aaa", fontSize: "0.78rem" }}>
                            Your run will be a <strong style={{ color: "#ff6600" }}>Gauntlet run</strong>.
                            Beat {Number(beacon.target_score).toLocaleString()} pts to win {sentinelStake} STRK.
                            If you fail, {challengerStakeDisplay} STRK goes to the sentinel.
                        </div>

                        {error && <p className="gauntlet-error">{error}</p>}

                        <div className="tg-footer">
                            <button className="gauntlet-btn gauntlet-btn-muted" onClick={onClose} disabled={loading}>
                                Back
                            </button>
                            <button
                                className="gauntlet-btn gauntlet-btn-primary"
                                onClick={handleAnswer}
                                disabled={loading}
                            >
                                {loading ? "Staking…" : `Stake ${challengerStakeDisplay} STRK & Play`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
