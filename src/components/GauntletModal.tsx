import { useState, useEffect, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "./DojoContext";
import {
    getActiveBeacons,
    getSentinelBeacons,
    recallGauntlet,
    settleGauntlet,
    weiToStrk,
    BEACON_STATUS,
    type GauntletBeacon,
} from "../services/gauntletService";
import { waitForTransaction } from "../services/dojoService";
import { ThrowGauntletModal } from "./ThrowGauntletModal";
import { AnswerGauntletModal } from "./AnswerGauntletModal";
import "./GauntletModal.css";

type Tab = "live" | "mine";

const STATUS_LABEL: Record<number, string> = {
    [BEACON_STATUS.ACTIVE]: "ACTIVE",
    [BEACON_STATUS.WINNER]: "BEATEN",
    [BEACON_STATUS.EXPIRED]: "EXPIRED",
    [BEACON_STATUS.CANCELLED]: "RECALLED",
};

const STATUS_CLASS: Record<number, string> = {
    [BEACON_STATUS.ACTIVE]: "gauntlet-badge-active",
    [BEACON_STATUS.WINNER]: "gauntlet-badge-winner",
    [BEACON_STATUS.EXPIRED]: "gauntlet-badge-expired",
    [BEACON_STATUS.CANCELLED]: "gauntlet-badge-cancelled",
};

interface GauntletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GauntletModal({ isOpen, onClose }: GauntletModalProps) {
    const { address, account } = useAccount();
    const { showTx, hideTx } = useDojo();

    const [tab, setTab] = useState<Tab>("live");
    const [liveBeacons, setLiveBeacons] = useState<GauntletBeacon[]>([]);
    const [myBeacons, setMyBeacons] = useState<GauntletBeacon[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionLoading, setActionLoading] = useState<string>(""); // beacon_id being actioned

    // Sub-modal state
    const [showThrow, setShowThrow] = useState(false);
    const [answerTarget, setAnswerTarget] = useState<GauntletBeacon | null>(null);

    const loadBeacons = useCallback(async () => {
        setLoading(true);
        try {
            const live = await getActiveBeacons(30);
            setLiveBeacons(live);
            if (address) {
                const mine = await getSentinelBeacons(address);
                setMyBeacons(mine);
            }
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (isOpen) {
            loadBeacons();
            setActionError("");
        }
    }, [isOpen, loadBeacons]);

    const handleRecall = async (beacon: GauntletBeacon) => {
        if (!account) return;
        setActionError("");
        setActionLoading(beacon.beacon_id);
        showTx("Recalling Gauntlet…");
        try {
            const result = await recallGauntlet(account, beacon.beacon_id);
            await waitForTransaction(result.transaction_hash);
            hideTx();
            await loadBeacons();
        } catch (e: any) {
            hideTx();
            setActionError(e?.message ?? "Transaction failed");
        } finally {
            setActionLoading("");
        }
    };

    const handleSettle = async (beacon: GauntletBeacon) => {
        if (!account) return;
        setActionError("");
        setActionLoading(beacon.beacon_id);
        showTx("Settling expired beacon…");
        try {
            const result = await settleGauntlet(account, beacon.beacon_id);
            await waitForTransaction(result.transaction_hash);
            hideTx();
            await loadBeacons();
        } catch (e: any) {
            hideTx();
            setActionError(e?.message ?? "Transaction failed");
        } finally {
            setActionLoading("");
        }
    };

    const isOwnBeacon = (beacon: GauntletBeacon) => {
        if (!address) return false;
        return address.toLowerCase() === beacon.sentinel_address.toLowerCase();
    };

    if (!isOpen) return null;

    const beaconsToShow = tab === "live" ? liveBeacons : myBeacons;

    return (
        <>
            <div className="gauntlet-modal-overlay" onClick={onClose}>
                <div className="gauntlet-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="gauntlet-modal-header">
                        <div>
                            <h2 className="gauntlet-modal-title">Gauntlet Protocol</h2>
                            <p className="gauntlet-modal-subtitle">
                                Stake STRK on your score. Challengers rise. Stakes are absorbed.
                            </p>
                        </div>
                        <button className="gauntlet-modal-close" onClick={onClose}>×</button>
                    </div>

                    {/* Throw CTA */}
                    <div className="gauntlet-throw-banner">
                        <p>
                            Finished a Story run with a score you're proud of?{" "}
                            <strong style={{ color: "#ff6600" }}>Throw your gauntlet</strong> and dare others to beat it.
                        </p>
                        <button
                            className="gauntlet-btn gauntlet-btn-primary"
                            onClick={() => setShowThrow(true)}
                            disabled={!address}
                        >
                            + Throw Gauntlet
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="gauntlet-tabs">
                        <button
                            className={`gauntlet-tab ${tab === "live" ? "active" : ""}`}
                            onClick={() => setTab("live")}
                        >
                            Live Beacons ({liveBeacons.length})
                        </button>
                        <button
                            className={`gauntlet-tab ${tab === "mine" ? "active" : ""}`}
                            onClick={() => { setTab("mine"); }}
                            disabled={!address}
                        >
                            My Beacons ({myBeacons.length})
                        </button>
                    </div>

                    {/* Error */}
                    {actionError && <p className="gauntlet-error">{actionError}</p>}

                    {/* Beacon list */}
                    {loading ? (
                        <p className="gauntlet-loading">Scanning the grid…</p>
                    ) : beaconsToShow.length === 0 ? (
                        <p className="gauntlet-empty">
                            {tab === "live"
                                ? "No active gauntlets. Be the first to throw one."
                                : "You haven't thrown any gauntlets yet."}
                        </p>
                    ) : (
                        <div className="gauntlet-beacon-list">
                            {beaconsToShow.map((beacon) => (
                                <BeaconCard
                                    key={beacon.beacon_id}
                                    beacon={beacon}
                                    isOwn={isOwnBeacon(beacon)}
                                    isActionLoading={actionLoading === beacon.beacon_id}
                                    onAnswer={() => setAnswerTarget(beacon)}
                                    onRecall={() => handleRecall(beacon)}
                                    onSettle={() => handleSettle(beacon)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-modals */}
            {showThrow && (
                <ThrowGauntletModal
                    isOpen={showThrow}
                    onClose={() => setShowThrow(false)}
                    onSuccess={loadBeacons}
                />
            )}

            {answerTarget && (
                <AnswerGauntletModal
                    isOpen={!!answerTarget}
                    beacon={answerTarget}
                    onClose={() => setAnswerTarget(null)}
                />
            )}
        </>
    );
}

// ── Beacon Card ──────────────────────────────────────────────────────────────

interface BeaconCardProps {
    beacon: GauntletBeacon;
    isOwn: boolean;
    isActionLoading: boolean;
    onAnswer: () => void;
    onRecall: () => void;
    onSettle: () => void;
}

function BeaconCard({ beacon, isOwn, isActionLoading, onAnswer, onRecall, onSettle }: BeaconCardProps) {
    const isActive = beacon.status === BEACON_STATUS.ACTIVE;
    const absorbed = BigInt(beacon.total_absorbed_from_challengers);

    return (
        <div className="gauntlet-beacon-card">
            <div className="gauntlet-beacon-card-header">
                <div className="gauntlet-beacon-sentinel">
                    Sentinel{" "}
                    <span>
                        {beacon.sentinel_address.slice(0, 8)}…{beacon.sentinel_address.slice(-6)}
                    </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`gauntlet-badge ${STATUS_CLASS[beacon.status] ?? ""}`}>
                        {STATUS_LABEL[beacon.status] ?? "UNKNOWN"}
                    </span>
                    {isOwn && <span className="gauntlet-badge" style={{ color: "#ff6600", borderColor: "#ff6600" }}>YOURS</span>}
                </div>
            </div>

            <div className="gauntlet-beacon-score">
                {Number(beacon.target_score).toLocaleString()}
                <small>pts to beat</small>
            </div>

            <div className="gauntlet-beacon-stats">
                <div className="gauntlet-stat">
                    <span className="gauntlet-stat-label">Prize</span>
                    <span className="gauntlet-stat-value strk">{weiToStrk(beacon.sentinel_stake)} STRK</span>
                </div>
                <div className="gauntlet-stat">
                    <span className="gauntlet-stat-label">Your stake</span>
                    <span className="gauntlet-stat-value strk">{weiToStrk(beacon.challenger_stake_required)} STRK</span>
                </div>
                <div className="gauntlet-stat">
                    <span className="gauntlet-stat-label">Absorbed</span>
                    <span className="gauntlet-stat-value strk">{weiToStrk(absorbed)} STRK</span>
                </div>
                <div className="gauntlet-stat">
                    <span className="gauntlet-stat-label">Expires</span>
                    <span className="gauntlet-stat-value">#{Number(beacon.expires_at_block).toLocaleString()}</span>
                </div>
            </div>

            {isActive && (
                <div className="gauntlet-beacon-actions">
                    {!isOwn && (
                        <button
                            className="gauntlet-btn gauntlet-btn-secondary"
                            onClick={onAnswer}
                            disabled={isActionLoading}
                        >
                            Answer Gauntlet
                        </button>
                    )}
                    {isOwn && (
                        <button
                            className="gauntlet-btn gauntlet-btn-danger"
                            onClick={onRecall}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "…" : "Recall (−15% fee)"}
                        </button>
                    )}
                    <button
                        className="gauntlet-btn gauntlet-btn-muted"
                        onClick={onSettle}
                        disabled={isActionLoading}
                        title="Only works if beacon has expired"
                    >
                        {isActionLoading ? "…" : "Settle"}
                    </button>
                </div>
            )}
        </div>
    );
}
