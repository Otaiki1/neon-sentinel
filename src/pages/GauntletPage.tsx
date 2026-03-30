import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "../components/DojoContext";
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
import { ThrowGauntletModal } from "../components/ThrowGauntletModal";
import { AnswerGauntletModal } from "../components/AnswerGauntletModal";
import "./GauntletPage.css";
import "../pages/LandingPage.css";

type Tab = "live" | "mine";

const STATUS_LABEL: Record<number, string> = {
    [BEACON_STATUS.ACTIVE]: "ACTIVE",
    [BEACON_STATUS.WINNER]: "BEATEN",
    [BEACON_STATUS.EXPIRED]: "EXPIRED",
    [BEACON_STATUS.CANCELLED]: "RECALLED",
};

const STATUS_CLASS: Record<number, string> = {
    [BEACON_STATUS.ACTIVE]: "gp-badge-active",
    [BEACON_STATUS.WINNER]: "gp-badge-winner",
    [BEACON_STATUS.EXPIRED]: "gp-badge-expired",
    [BEACON_STATUS.CANCELLED]: "gp-badge-cancelled",
};

export default function GauntletPage() {
    const navigate = useNavigate();
    const { address, account } = useAccount();
    const { showTx, hideTx } = useDojo();

    const [tab, setTab] = useState<Tab>("live");
    const [liveBeacons, setLiveBeacons] = useState<GauntletBeacon[]>([]);
    const [myBeacons, setMyBeacons] = useState<GauntletBeacon[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionLoading, setActionLoading] = useState<string>("");

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
        loadBeacons();
    }, [loadBeacons]);

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

    const beaconsToShow = tab === "live" ? liveBeacons : myBeacons;

    return (
        <>
            <div className="gp-page scanlines">
                {/* Top bar */}
                <div className="gp-topbar">
                    <button className="gp-back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <div className="gp-topbar-brand">
                        <span className="gp-topbar-dot" />
                        NEON SENTINEL
                    </div>
                </div>

                {/* Page header */}
                <header className="gp-header">
                    <div className="gp-header-inner">
                        <h1 className="gp-title">Gauntlet Protocol</h1>
                        <p className="gp-subtitle">
                            Stake STRK on your score. Challengers rise. Stakes are absorbed.
                        </p>
                    </div>
                    <button
                        className="gp-throw-btn"
                        onClick={() => setShowThrow(true)}
                        disabled={!address}
                    >
                        + Throw Gauntlet
                    </button>
                </header>

                {/* Tabs */}
                <div className="gp-tabs-bar">
                    <button
                        className={`gp-tab ${tab === "live" ? "active" : ""}`}
                        onClick={() => setTab("live")}
                    >
                        Live Beacons
                        <span className="gp-tab-count">{liveBeacons.length}</span>
                    </button>
                    <button
                        className={`gp-tab ${tab === "mine" ? "active" : ""}`}
                        onClick={() => setTab("mine")}
                        disabled={!address}
                    >
                        My Beacons
                        <span className="gp-tab-count">{myBeacons.length}</span>
                    </button>
                </div>

                {/* Content */}
                <main className="gp-content">
                    {actionError && <p className="gp-error">{actionError}</p>}

                    {loading ? (
                        <p className="gp-loading">Scanning the grid…</p>
                    ) : beaconsToShow.length === 0 ? (
                        <div className="gp-empty">
                            <p>
                                {tab === "live"
                                    ? "No active gauntlets. Be the first to throw one."
                                    : "You haven't thrown any gauntlets yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="gp-beacon-grid">
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
                </main>
            </div>

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
        <div className="gp-beacon-card">
            <div className="gp-beacon-card-header">
                <div className="gp-beacon-sentinel">
                    Sentinel{" "}
                    <span>
                        {beacon.sentinel_address.slice(0, 8)}…{beacon.sentinel_address.slice(-6)}
                    </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`gp-badge ${STATUS_CLASS[beacon.status] ?? ""}`}>
                        {STATUS_LABEL[beacon.status] ?? "UNKNOWN"}
                    </span>
                    {isOwn && (
                        <span className="gp-badge gp-badge-yours">YOURS</span>
                    )}
                </div>
            </div>

            <div className="gp-beacon-score">
                {Number(beacon.target_score).toLocaleString()}
                <small>pts to beat</small>
            </div>

            <div className="gp-beacon-stats">
                <div className="gp-stat">
                    <span className="gp-stat-label">Prize</span>
                    <span className="gp-stat-value strk">{weiToStrk(beacon.sentinel_stake)} STRK</span>
                </div>
                <div className="gp-stat">
                    <span className="gp-stat-label">Your stake</span>
                    <span className="gp-stat-value strk">{weiToStrk(beacon.challenger_stake_required)} STRK</span>
                </div>
                <div className="gp-stat">
                    <span className="gp-stat-label">Absorbed</span>
                    <span className="gp-stat-value strk">{weiToStrk(absorbed)} STRK</span>
                </div>
                <div className="gp-stat">
                    <span className="gp-stat-label">Expires</span>
                    <span className="gp-stat-value">#{Number(beacon.expires_at_block).toLocaleString()}</span>
                </div>
                <div className="gp-stat">
                    <span className="gp-stat-label">Attempts</span>
                    <span className="gp-stat-value">{beacon.total_attempts}</span>
                </div>
            </div>

            {isActive && (
                <div className="gp-beacon-actions">
                    {!isOwn && (
                        <button
                            className="gp-btn gp-btn-primary"
                            onClick={onAnswer}
                            disabled={isActionLoading}
                        >
                            Answer Gauntlet
                        </button>
                    )}
                    {isOwn && (
                        <button
                            className="gp-btn gp-btn-danger"
                            onClick={onRecall}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "…" : "Recall (−15% fee)"}
                        </button>
                    )}
                    <button
                        className="gp-btn gp-btn-muted"
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
