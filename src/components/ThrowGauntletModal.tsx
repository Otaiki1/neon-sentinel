import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "./DojoContext";
import {
    throwGauntlet,
    strkToWei,
    weiToStrk,
} from "../services/gauntletService";
import { getPlayerLeaderboardEntries } from "../services/dojoService";
import { waitForTransaction } from "../services/dojoService";
import "./GauntletModal.css";
import "./ThrowGauntletModal.css";

// Default gauntlet duration ≈ 1 day (7200 blocks)
const DEFAULT_DURATION_BLOCKS = 7200;
const MAX_DURATION_BLOCKS = 50400; // 7 days

interface ThrowGauntletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CompletedRun {
    run_id: string;
    final_score: number;
    week: number;
}

export function ThrowGauntletModal({ isOpen, onClose, onSuccess }: ThrowGauntletModalProps) {
    const { account, address } = useAccount();
    const { showTx, hideTx } = useDojo();

    const [completedRuns, setCompletedRuns] = useState<CompletedRun[]>([]);
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [selectedScore, setSelectedScore] = useState<number>(0);
    const [sentinelStake, setSentinelStake] = useState("1");
    const [challengerStake, setChallengerStake] = useState("0.5");
    const [durationBlocks, setDurationBlocks] = useState(DEFAULT_DURATION_BLOCKS);
    const [loading, setLoading] = useState(false);
    const [loadingRuns, setLoadingRuns] = useState(false);
    const [error, setError] = useState("");

    // Load player's completed runs from leaderboard entries
    useEffect(() => {
        if (!isOpen || !address) return;
        setLoadingRuns(true);
        getPlayerLeaderboardEntries(address)
            .then((entries) => {
                const runs = entries.map((e) => ({
                    run_id: e.run_id,
                    final_score: Number(e.final_score),
                    week: e.week,
                }));
                setCompletedRuns(runs);
                if (runs.length > 0 && !selectedRunId) {
                    setSelectedRunId(runs[0].run_id);
                    setSelectedScore(runs[0].final_score);
                }
            })
            .finally(() => setLoadingRuns(false));
    }, [isOpen, address]);

    // Derive max challenger stake (70% of sentinel stake)
    const sentinelWei = (() => { try { return strkToWei(sentinelStake); } catch { return 0n; } })();
    const maxChallengerWei = (sentinelWei * 70n) / 100n;
    const challengerWei = (() => { try { return strkToWei(challengerStake); } catch { return 0n; } })();

    const challengerExceedsMax = challengerWei > maxChallengerWei;
    const sentinelTooLow = sentinelWei < 1_000_000_000_000_000_000n; // 1 STRK min
    const sentinelTooHigh = sentinelWei > 10_000_000_000_000_000_000_000n; // 10000 STRK max

    const canSubmit =
        account &&
        selectedRunId &&
        !sentinelTooLow &&
        !sentinelTooHigh &&
        !challengerExceedsMax &&
        challengerWei > 0n &&
        durationBlocks > 0 &&
        durationBlocks <= MAX_DURATION_BLOCKS &&
        !loading;

    const handleThrow = async () => {
        if (!account || !canSubmit) return;
        setError("");
        setLoading(true);
        showTx("Throwing Gauntlet… staking STRK…");
        try {
            const result = await throwGauntlet(
                account,
                selectedRunId,
                sentinelWei,
                challengerWei,
                durationBlocks,
            );
            await waitForTransaction(result.transaction_hash);
            hideTx();
            onSuccess();
            onClose();
        } catch (e: any) {
            hideTx();
            setError(e?.message ?? "Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    const durationLabel = (blocks: number) => {
        const hours = Math.round((blocks / 7200) * 24);
        return `${blocks.toLocaleString()} blocks (~${hours}h)`;
    };

    if (!isOpen) return null;

    return (
        <div className="gauntlet-modal-overlay" onClick={onClose}>
            <div className="gauntlet-modal" onClick={(e) => e.stopPropagation()}>
                <div className="gauntlet-modal-header">
                    <div>
                        <h2 className="gauntlet-modal-title">Throw Gauntlet</h2>
                        <p className="gauntlet-modal-subtitle">
                            Stake STRK on your run. Challengers who can't beat you fuel your treasury.
                        </p>
                    </div>
                    <button className="gauntlet-modal-close" onClick={onClose}>×</button>
                </div>

                {!address ? (
                    <p style={{ color: "#888", textAlign: "center", padding: "2rem 0" }}>
                        Connect your wallet to throw a gauntlet.
                    </p>
                ) : (
                    <div className="tg-form">
                        {/* Run selection */}
                        <div className="tg-field">
                            <label className="tg-label">
                                Select your run <span>(Story Mode only)</span>
                            </label>
                            {loadingRuns ? (
                                <p className="gauntlet-loading">Loading runs…</p>
                            ) : completedRuns.length === 0 ? (
                                <p className="gauntlet-empty">
                                    No completed runs found. Finish a Story Mode run first.
                                </p>
                            ) : (
                                <div className="tg-run-list">
                                    {completedRuns.map((run) => (
                                        <button
                                            key={run.run_id}
                                            type="button"
                                            className={`tg-run-option ${selectedRunId === run.run_id ? "selected" : ""}`}
                                            onClick={() => {
                                                setSelectedRunId(run.run_id);
                                                setSelectedScore(run.final_score);
                                            }}
                                        >
                                            <span className="tg-run-score">{run.final_score.toLocaleString()} pts</span>
                                            <span className="tg-run-meta">Week {run.week} · {run.run_id.slice(0, 12)}…</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sentinel stake */}
                        <div className="tg-field">
                            <label className="tg-label">Your stake (STRK)</label>
                            <input
                                className="tg-input"
                                type="number"
                                min="1"
                                step="0.5"
                                value={sentinelStake}
                                onChange={(e) => setSentinelStake(e.target.value)}
                                placeholder="e.g. 5"
                            />
                            {sentinelTooLow && <p className="tg-hint warning">Minimum stake is 1 STRK.</p>}
                            {sentinelTooHigh && <p className="tg-hint warning">Maximum stake is 10,000 STRK.</p>}
                        </div>

                        {/* Challenger stake */}
                        <div className="tg-field">
                            <label className="tg-label">
                                Challenger must stake (STRK) <span>max 70% of yours</span>
                            </label>
                            <input
                                className="tg-input"
                                type="number"
                                min="0.01"
                                step="0.1"
                                value={challengerStake}
                                onChange={(e) => setChallengerStake(e.target.value)}
                                placeholder="e.g. 2"
                            />
                            {challengerExceedsMax && (
                                <p className="tg-hint warning">
                                    Max allowed: {weiToStrk(maxChallengerWei)} STRK (70% of your stake).
                                </p>
                            )}
                        </div>

                        {/* Duration */}
                        <div className="tg-field">
                            <label className="tg-label">Challenge window</label>
                            <select
                                className="tg-input"
                                value={durationBlocks}
                                onChange={(e) => setDurationBlocks(Number(e.target.value))}
                            >
                                <option value={3600}>3,600 blocks (~12h)</option>
                                <option value={7200}>7,200 blocks (~24h) — default</option>
                                <option value={14400}>14,400 blocks (~48h)</option>
                                <option value={36000}>36,000 blocks (~5 days)</option>
                                <option value={50400}>50,400 blocks (~7 days)</option>
                            </select>
                            <p className="tg-hint">
                                Early cancellation costs 15% of your stake.
                            </p>
                        </div>

                        {/* Summary */}
                        {selectedRunId && !sentinelTooLow && !sentinelTooHigh && !challengerExceedsMax && (
                            <div className="tg-summary">
                                <div className="tg-summary-row">
                                    <span className="tg-summary-label">Defending score</span>
                                    <span className="tg-summary-value">{selectedScore.toLocaleString()} pts</span>
                                </div>
                                <div className="tg-summary-row">
                                    <span className="tg-summary-label">Your stake</span>
                                    <span className="tg-summary-value strk">{sentinelStake} STRK</span>
                                </div>
                                <div className="tg-summary-row">
                                    <span className="tg-summary-label">Per challenger</span>
                                    <span className="tg-summary-value strk">{challengerStake} STRK</span>
                                </div>
                                <div className="tg-summary-row">
                                    <span className="tg-summary-label">Window</span>
                                    <span className="tg-summary-value">{durationLabel(durationBlocks)}</span>
                                </div>
                            </div>
                        )}

                        {error && <p className="gauntlet-error">{error}</p>}

                        <div className="tg-footer">
                            <button className="gauntlet-btn gauntlet-btn-muted" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button
                                className="gauntlet-btn gauntlet-btn-primary"
                                onClick={handleThrow}
                                disabled={!canSubmit}
                            >
                                {loading ? "Staking…" : "Throw Gauntlet"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
