import { useAccount } from "@starknet-react/core";
import { Link } from "react-router-dom";
import { useDojo } from "../components/DojoContext";
import {
    buyCoins as buyCoinsOnChain,
} from "../services/dojoService";
import {
    fetchWeeklyLeaderboard,
    getCurrentOnchainWeek,
} from "../services/scoreService";
import { CUSTOMIZABLE_SETTINGS } from "../game/config";
import {
    getGameplaySettings,
    saveGameplaySettings,
    type GameplaySettings,
} from "../services/settingsService";
import {
    getAvailableCoins,
} from "../services/coinService";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import logoImage from "../assets/logo.png";
import iconProfile from "../assets/icons/icon-profile.svg";
import iconHall from "../assets/icons/icon-hall.svg";
import iconSettings from "../assets/icons/icon-settings.svg";
import iconMarketplace from "../assets/icons/icon-marketplace.svg";
import iconInventory from "../assets/icons/icon-inventory.svg";
import iconLogin from "../assets/icons/icon-login.svg";
import WalletConnectionModal from "../components/WalletConnectionModal";

import AvatarSelectionModal from "../components/AvatarSelectionModal";
import { InventoryModal } from "../components/InventoryModal";
import { PregameUpgradesModal } from "../components/PregameUpgradesModal";


import CommanderWalkthrough from "../components/CommanderWalkthrough";
import {
    getActiveAvatar,
    getAvatarConfig,
    getAllAvatarsWithStatus,
    setActiveAvatar as setActiveAvatarId,
} from "../services/avatarService";
import { getCurrentRankFromStorage, getCurrentPrestigeFromStorage } from "../services/rankService";
import type { AvatarId } from "../services/avatarService";
import "./LandingPage.css";

const HERO_SPRITE_PATHS: Record<string, string> = {
    heroGrade1: "/hero/hero-grade-1.svg",
    heroGrade1Blue: "/hero/hero-grade-1-blue-skin.svg",
    heroGrade2: "/hero/hero-grade-2.svg",
    heroGrade2Purple: "/hero/hero-grade-2-purple-skin.svg",
    heroGrade3: "/hero/hero-grade-3.svg",
    heroGrade3Red: "/hero/hero-grade-3-red-skin.svg",
    heroGrade4: "/hero/hero-grade-4.svg",
    heroGrade4Orange: "/hero/hero-grade-4-orange-skin.svg",
    heroGrade5: "/hero/hero-grade-5.svg",
    heroGrade5White: "/hero/hero-grade-5-white-skin.svg",
};

function getHeroPortraitPath(spriteKey: string): string {
    return HERO_SPRITE_PATHS[spriteKey] ?? `/hero/hero-grade-1.svg`;
}

const WALLET_MODAL_SEEN_KEY = "neon-sentinel-wallet-modal-seen";
const USER_MODE_KEY = "neon-sentinel-user-mode";




export type UserMode = "wallet" | "anonymous";

export function getUserMode(): UserMode | null {
    const stored = localStorage.getItem(USER_MODE_KEY);
    return stored === "wallet" || stored === "anonymous" ? stored : null;
}

export function setUserMode(mode: UserMode): void {
    localStorage.setItem(USER_MODE_KEY, mode);
}

function LandingPage() {
    const { account, address, isConnected: isWalletConnected } = useAccount();
    const { profile, refreshProfile, showTx, hideTx } = useDojo();
    const walletLabel = isWalletConnected
        ? `${address!.slice(0, 6)}...${address!.slice(-4)}`
        : "LOGIN";
    const [leaderboard, setLeaderboard] = useState<
        Array<{
            score: number;
            playerName: string;
            prestigeLevel?: number;
            currentRank?: string;
        }>
    >([]);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [showWalletModal, setShowWalletModal] = useState(false);
        const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showPregameModal, setShowPregameModal] = useState(false);
    const [activeAvatar, setActiveAvatar] = useState(getActiveAvatar());
    const [settings, setSettings] = useState<GameplaySettings>(
        getGameplaySettings(),
    );
    const [coins, setCoins] = useState(getAvailableCoins());
    useEffect(() => {
        if (profile?.coins != null) {
            setCoins(Number(profile.coins));
        } else {
            setCoins(getAvailableCoins());
        }
    }, [profile]);
    const [currentRank, setCurrentRank] = useState(() => {
        const stored = getCurrentRankFromStorage();
        return stored ? stored.name : "Initiate Sentinel";
    });

    useEffect(() => {
        const scores = fetchWeeklyLeaderboard();
        setLeaderboard(scores.slice(0, 3)); // Top 3
        setCurrentWeek(getCurrentOnchainWeek());
        setSettings(getGameplaySettings());
        // Don't reset coins here — allow profile useEffect to set on-chain balance

        // Update rank display
        const stored = getCurrentRankFromStorage();
        if (stored) {
            setCurrentRank(stored.name);
        } else {
            // Default to Initiate Sentinel - rank will update during gameplay
            setCurrentRank("Initiate Sentinel");
        }
    }, []);

    // Show wallet modal on first visit if wallet not connected
    useEffect(() => {
        const hasSeenModal =
            localStorage.getItem(WALLET_MODAL_SEEN_KEY) === "true";
        const userMode = getUserMode();

        // Show modal if:
        // 1. User hasn't seen the modal before
        // 2. No wallet is connected
        // 3. No user mode is set (first visit)
        if (!hasSeenModal && !isWalletConnected && !userMode) {
            setShowWalletModal(true);
        }
    }, [isWalletConnected]);

    const handleCloseModal = () => {
        setShowWalletModal(false);
        localStorage.setItem(WALLET_MODAL_SEEN_KEY, "true");
    };

    const handleOpenWalletModal = () => {
        setShowWalletModal(true);
    };

    const handleAnonymous = () => {
        setUserMode("anonymous");
        handleCloseModal();
    };

    
    const handleOpenSettings = () => {
        setSettings(getGameplaySettings());
        setShowSettingsModal(true);
    };

    const handleCloseSettings = () => {
        setShowSettingsModal(false);
    };

    const handleSaveSettings = () => {
        saveGameplaySettings(settings);
        setShowSettingsModal(false);
    };

    const handleOpenMarketplace = () => {
        // Don't overwrite coins here — the useEffect on [profile] already keeps
        // coins in sync with the on-chain balance. Calling getAvailableCoins()
        // here would reset it to the localStorage fallback (3).
        setShowMarketplaceModal(true);
    };

    const handleCloseMarketplace = () => {
        setShowMarketplaceModal(false);
    };

    const [buyStatus, setBuyStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [buyStatusMsg, setBuyStatusMsg] = useState('');

    const handleBuyCoins = async (coinAmount: number) => {
        if (!account) {
            setBuyStatusMsg('Connect your wallet to buy coins.');
            setBuyStatus('error');
            setTimeout(() => setBuyStatus('idle'), 3000);
            return;
        }
        setBuyStatus('pending');
        const msg = `Buying ${coinAmount} coins…`;
        setBuyStatusMsg(msg);
        showTx(msg);
        try {
            await buyCoinsOnChain(account, coinAmount);
            hideTx();
            setBuyStatus('success');
            setBuyStatusMsg(`✓ ${coinAmount} coins purchased!`);
            // Optimistically update balance immediately so the user sees the change now
            setCoins(prev => prev + coinAmount);
            setTimeout(() => setBuyStatus('idle'), 4000);
            // Poll Torii in the background until the indexed profile reflects the new balance
            let attempts = 0;
            const poll = setInterval(async () => {
                attempts++;
                await refreshProfile();
                if (attempts >= 6) clearInterval(poll);
            }, 3000);
        } catch (err: any) {
            hideTx();
            console.error('Failed to buy coins on-chain:', err);
            const msg = err?.message?.includes('Approve') ? 'STRK approval failed' :
                        err?.message?.includes('balance') ? 'Insufficient STRK balance' :
                        'Transaction failed. Try again.';
            setBuyStatus('error');
            setBuyStatusMsg(msg);
            setTimeout(() => setBuyStatus('idle'), 5000);
        }
    };

    const handleOpenAvatarModal = () => {
        setShowAvatarModal(true);
    };

    const handleCloseAvatarModal = () => {
        setShowAvatarModal(false);
    };

    const handleAvatarChange = () => {
        setActiveAvatar(getActiveAvatar());
    };

    

    // Update user mode when wallet connects
    useEffect(() => {
        if (address) {
            setUserMode("wallet");
        }
    }, [address]);

    
    // Generate weekly sector name based on week number
    const weeklySectorNames = [
        "Crimson Virus",
        "Void Protocol",
        "Dark Matrix",
        "Neon Flux",
        "System Breach",
        "Quantum Core",
        "Data Storm",
        "Cyber Pulse",
        "Grid Lock",
        "Binary Warp",
        "Code Cascade",
        "Signal Void",
        "Neural Mesh",
        "Pixel Rift",
        "Vector Shift",
        "Kernel Wave",
        "Digital Tide",
        "Byte Storm",
        "Frame Flux",
        "Grid Surge",
        "Circuit Fire",
        "Data Flow",
        "Signal Peak",
        "Neon Wave",
        "Cyber Pulse",
        "Void Core",
        "Matrix Lock",
        "Binary Flow",
        "Quantum Flux",
        "Neural Storm",
        "Code Rift",
        "System Core",
        "Grid Warp",
        "Pixel Void",
        "Vector Mesh",
        "Kernel Surge",
        "Digital Peak",
        "Byte Flux",
        "Frame Shift",
        "Circuit Tide",
        "Data Pulse",
        "Signal Core",
        "Neon Lock",
        "Cyber Flow",
        "Void Mesh",
        "Matrix Warp",
        "Binary Rift",
        "Quantum Lock",
        "Neural Core",
        "Code Surge",
        "System Flux",
        "Grid Storm",
        "Pixel Core",
        "Vector Lock",
        "Kernel Flow",
        "Digital Mesh",
    ];
    const sectorName =
        weeklySectorNames[(currentWeek - 1) % weeklySectorNames.length];

    const topPlayer = leaderboard[0]?.playerName || "None";

    /* Parallax for hero character */
    const heroRef = useRef<HTMLDivElement>(null);
    const [parallax, setParallax] = useState({ x: 0, y: 0 });
    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        setParallax({ x: dx * 8, y: dy * 8 });
    }, []);
    const onMouseLeave = useCallback(() => setParallax({ x: 0, y: 0 }), []);

    /* Data stream chars for matrix effect (stable once) */
    const dataStreamLine = useMemo(() => {
        const chars =
            "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ";
        return Array.from({ length: 40 }, () =>
            Array.from(
                { length: 12 },
                () => chars[Math.floor(Math.random() * chars.length)],
            ).join(""),
        ).join("\n");
    }, []);

    /* Ticker tape content (duplicated for seamless scroll) */
    const tickerItems = [
        "MARSTORES · MARKET FLUCTUATIONS ·",
        `SECTOR CHAMPION: ${topPlayer || "NONE"} ·`,
        "GRID STATUS: ACTIVE · NEON TERMINAL ONLINE ·",
        "PRESTIGE CYCLE ACTIVE · KERNEL DEPLOYMENT READY ·",
    ];
    const tickerText = [...tickerItems, ...tickerItems].join("  ");

    /* Kernel/avatar list for SELECT KERNEL - ensure we always have at least the active one */
    const kernelAvatars = useMemo(() => {
        const prestige = getCurrentPrestigeFromStorage();
        const list = getAllAvatarsWithStatus(prestige);
        if (list.length === 0) {
            const config = getAvatarConfig(activeAvatar);
            return [
                {
                    id: activeAvatar,
                    config,
                    isUnlocked: true,
                } as { id: AvatarId; config: ReturnType<typeof getAvatarConfig>; isUnlocked: boolean },
            ];
        }
        return list;
    }, [activeAvatar]);

    return (
        <div className="min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
            <CommanderWalkthrough onComplete={() => {}} />

            {/* Background Image */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "url(/sentinel-bg.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            />

            {/* Black overlay on background */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{ background: "rgba(0, 0, 0, 0.9)" }}
                aria-hidden
            />

            {/* Subtle tech background: soft green glow + star-like dots */}
            <div
                className="landing-bg-tech fixed inset-0 pointer-events-none z-0"
                aria-hidden
            />

            <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
                <header className="landing-header mb-8 md:mb-10">
                    <nav
                        className="landing-nav mb-6"
                        aria-label="Main navigation"
                    >
                        <span className="nav-scan-line" aria-hidden />
                        
                            <Link
                                to="/leaderboards"
                                className="nav-icon-button"
                                aria-label="Hall of Fame"
                            >
                                <img
                                    src={iconHall}
                                    alt=""
                                    className="nav-icon-image"
                                />
                                <span className="nav-icon-label">HALL</span>
                            </Link>
                        
                        
                            <Link
                                to="/profile"
                                className="nav-icon-button"
                                aria-label="Profile"
                            >
                                <img
                                    src={iconProfile}
                                    alt=""
                                    className="nav-icon-image"
                                />
                                <span className="nav-icon-label">PROFILE</span>
                            </Link>
                        
                        
                            <button
                                type="button"
                                className="nav-icon-button"
                                onClick={handleOpenSettings}
                                aria-label="Settings"
                            >
                                <img
                                    src={iconSettings}
                                    alt=""
                                    className="nav-icon-image"
                                />
                                <span className="nav-icon-label">SETTINGS</span>
                            </button>
                        
                        
                            <button
                                type="button"
                                className="nav-icon-button"
                                onClick={handleOpenMarketplace}
                                aria-label="Marketplace"
                            >
                                <img
                                    src={iconMarketplace}
                                    alt=""
                                    className="nav-icon-image"
                                />
                                <span className="nav-icon-label">MARKET</span>
                            </button>
                        
                        
                            <button
                                type="button"
                                className="nav-icon-button"
                                onClick={() => setShowInventoryModal(true)}
                                aria-label="Inventory"
                            >
                                <img
                                    src={iconInventory}
                                    alt=""
                                    className="nav-icon-image"
                                />
                                <span className="nav-icon-label">
                                    INVENTORY
                                </span>
                            </button>
                        
                        
                            <button
                                type="button"
                                className="nav-icon-button"
                                onClick={handleOpenWalletModal}
                                aria-label="Login"
                            >
                                <img
                                    src={iconLogin}
                                    alt=""
                                    className="nav-icon-image"
                                />
                                <span className="nav-icon-label">
                                    {walletLabel}
                                </span>
                            </button>
                        
                    </nav>
                    <section
                        className="landing-logo-section text-center mb-8 md:mb-10"
                        aria-label="Logo and weekly sector"
                    >
                        <div className="logo-container mb-6 flex justify-center">
                            <img
                                src={logoImage}
                                alt="Neon Sentinel"
                                className="max-w-full h-auto logo-glow"
                                style={{
                                    maxHeight: "140px",
                                    imageRendering: "auto",
                                }}
                            />
                        </div>
                        <div className="sector-subtitle">
                            <p
                                className="text-xl md:text-2xl font-logo text-neon-green"
                                style={{
                                    letterSpacing: "0.15em",
                                    textShadow: "0 0 10px rgba(0,255,0,0.8)",
                                }}
                            >
                                WEEKLY SECTOR: {sectorName}
                            </p>
                            <p
                                className="text-sm md:text-base font-body text-neon-green opacity-70 mt-2"
                                style={{ letterSpacing: "0.1em" }}
                            >
                                Week {currentWeek} · Grid Status:{" "}
                                <span
                                    className="status-breathing text-neon-green opacity-100 font-semibold"
                                    style={{
                                        textShadow: "0 0 8px rgba(0,255,0,0.8)",
                                    }}
                                >
                                    ACTIVE
                                </span>
                            </p>
                        </div>
                    </section>
                </header>

                <main className="landing-main">
                    {/* START GAME - wide, on top of hero card */}
                    <section
                        className="start-game-on-card mb-4"
                        aria-label="Start game"
                    >
                        
                            <button
                                type="button"
                                className="start-game-btn-link start-game-btn-wide font-display"
                                onClick={() => setShowPregameModal(true)}
                            >
                                <span className="start-game-btn-main">
                                    &gt;&gt; START GAME &lt;&lt;
                                </span>
                                <hr className="start-game-btn-divider" />
                                <p className="start-game-btn-subtitle">
                                    Liberate the Neon Terminal
                                </p>
                            </button>
                        
                    </section>

                    {/* Hero Panel: character left, two big buttons right */}
                    <section
                        className="hero-section"
                        aria-label="Character and actions"
                    >
                        <div
                            className="hero-panel retro-panel mb-6 md:mb-8"
                            ref={heroRef}
                            onMouseMove={onMouseMove}
                            onMouseLeave={onMouseLeave}
                        >
                            <div className="hero-panel-noise" aria-hidden />
                            <div className="hero-corner-brackets">
                                <span className="hero-corner-bracket bracket-tl" />
                                <span className="hero-corner-bracket bracket-tr" />
                                <span className="hero-corner-bracket bracket-bl" />
                                <span className="hero-corner-bracket bracket-br" />
                            </div>
                            <div className="hero-data-stream" aria-hidden>
                                <div className="hero-data-stream-inner hero-data-stream-col hero-data-stream-left">
                                    {dataStreamLine}
                                </div>
                                <div className="hero-data-stream-inner hero-data-stream-col hero-data-stream-center">
                                    {dataStreamLine}
                                </div>
                                <div className="hero-data-stream-inner hero-data-stream-col hero-data-stream-right">
                                    {dataStreamLine}
                                </div>
                            </div>
                            <div className="hero-panel-inner flex flex-col md:flex-row">
                                <div className="hero-panel-character flex-shrink-0 md:w-1/2 flex items-center justify-center min-h-[100px] md:min-h-[160px] p-3">
                                    <div className="hero-portrait-frame">
                                        <div
                                            className="hero-character-wrapper hero-character-glitch"
                                            style={{
                                                transform: `translate(${parallax.x}px, ${parallax.y}px)`,
                                            }}
                                        >
                                            <img
                                                src="/hero-full.svg"
                                                alt={
                                                    getAvatarConfig(
                                                        activeAvatar,
                                                    ).displayName
                                                }
                                                className="hero-character-image max-h-full w-auto object-contain"
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src = getHeroPortraitPath(
                                                        getAvatarConfig(
                                                            activeAvatar,
                                                        ).spriteKey,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="hero-panel-stats flex-1 flex flex-col justify-center p-4 md:p-5">
                                    <p
                                        className="font-body text-xs text-neon-green opacity-80 mb-1"
                                        style={{ letterSpacing: "0.1em" }}
                                    >
                                        SYNCH RATE{" "}
                                        {Math.min(
                                            100,
                                            Math.round(
                                                (getAvatarConfig(activeAvatar)
                                                    .stats.healthMult /
                                                    1.5) *
                                                    100,
                                            ),
                                        )}
                                        %
                                    </p>
                                    <h2
                                        className="hero-character-name font-menu text-neon-green mb-2"
                                        style={{
                                            letterSpacing: "0.1em",
                                        }}
                                    >
                                        {getAvatarConfig(
                                            activeAvatar,
                                        ).displayName.toUpperCase()}
                                    </h2>
                                    <p className="hero-rank-line font-body text-neon-green mb-2">
                                        Rank:{" "}
                                        {getCurrentRankFromStorage()
                                            ? `Prestige ${getCurrentRankFromStorage()!.prestige}`
                                            : currentRank}
                                    </p>
                                    <p className="hero-fire-line font-body mb-4">
                                        {getCurrentRankFromStorage()
                                            ? `Prestige ${getCurrentRankFromStorage()!.prestige}. Fire: ${getAvatarConfig(activeAvatar).displayName.toUpperCase()}`
                                            : "Progress to unlock ranks"}
                                    </p>
                                    {/* Two big wide buttons only */}
                                    <div className="hero-two-buttons">
                                        <button
                                            type="button"
                                            className="hero-big-btn retro-button font-menu"
                                            onClick={handleOpenAvatarModal}
                                        >
                                            CHANGE SENTINEL
                                        </button>
                                        <button
                                            type="button"
                                            className="hero-big-btn retro-button font-menu"
                                            onClick={() =>
                                                setShowInventoryModal(true)
                                            }
                                        >
                                            <img
                                                src={iconInventory}
                                                alt=""
                                                className="hero-big-btn-icon"
                                                aria-hidden
                                            />
                                            <span>OPEN INVENTORY</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CODE RENDERS divider */}
                    <div className="text-center py-2">
                        <span
                            className="font-menu text-sm text-neon-green opacity-70 border border-neon-green/50 px-4 py-1 inline-block"
                            style={{ letterSpacing: "0.15em" }}
                        >
                            &gt;&gt; CODE RENDERS &lt;&lt;
                        </span>
                    </div>

                    {/* SELECT CHARACTER: avatars + Start Game / Equip at top */}
                    <section
                        className="character-selection-section"
                        aria-label="Select character and start"
                    >
                        {/* EQUIP MINIMES at top of avatar section */}
                        <div className="kernel-cta-top flex flex-col items-center gap-4 mb-6">
                            <button
                                type="button"
                                className="equip-minimes-btn font-menu font-bold px-6 py-3"
                                onClick={() => setShowInventoryModal(true)}
                                aria-label="Equip Mini-Mes"
                            >
                                &gt;&gt; EQUIP MINIMES &gt;&gt;
                            </button>
                        </div>
                        
                            <div className="kernel-selector-panel mb-8 md:mb-10">
                                <div className="kernel-selector-header">
                                    <h2 className="kernel-selector-title">
                                        SELECT KERNEL
                                    </h2>
                                    <p className="kernel-selector-subtitle">
                                        Deploy a loadout · Tap to equip
                                    </p>
                                </div>
                                <div className="character-selector flex overflow-x-auto gap-5 pb-3 scroll-smooth snap-x snap-mandatory">
                                            {kernelAvatars.map(
                                                (
                                                    { id, config, isUnlocked },
                                                    index,
                                                ) => {
                                                    const selectedIndex =
                                                        kernelAvatars.findIndex(
                                                            (a) => a.id === activeAvatar,
                                                        );
                                                    const isEquipped =
                                                        activeAvatar === id;
                                                    const isLocked =
                                                        !isUnlocked;
                                                    const status = isEquipped
                                                        ? "Equipped"
                                                        : isLocked &&
                                                            (config?.unlockPrestige ?? 0) >
                                                                getCurrentPrestigeFromStorage()
                                                          ? "Prestige Required"
                                                          : isUnlocked
                                                            ? "Available"
                                                            : "Locked";
                                                    const portraitPath =
                                                        getHeroPortraitPath(
                                                            config?.spriteKey ?? "heroGrade1",
                                                        );
                                                    const flowSelected =
                                                        index === selectedIndex;
                                                    const flowSide =
                                                        !flowSelected;
                                                    return (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            className={`kernel-card flex-shrink-0 snap-center p-0 border-2 transition-all duration-300 ${isEquipped ? "kernel-card-equipped" : isUnlocked ? "kernel-card-available" : "kernel-card-locked"} ${flowSelected ? "kernel-card-flow-selected" : ""} ${flowSide ? "kernel-card-flow-side" : ""}`}
                                                            onClick={() => {
                                                                if (
                                                                    isUnlocked &&
                                                                    id !==
                                                                        activeAvatar
                                                                ) {
                                                                    setActiveAvatarId(
                                                                        id as AvatarId,
                                                                    );
                                                                    setActiveAvatar(
                                                                        getActiveAvatar(),
                                                                    );
                                                                } else if (
                                                                    !isUnlocked
                                                                ) {
                                                                    handleOpenAvatarModal();
                                                                }
                                                            }}
                                                        >
                                                            {isLocked && (
                                                                <span className="kernel-card-prestige-required">
                                                                    PRESTIGE
                                                                    REQUIRED
                                                                </span>
                                                            )}
                                                            <div className="kernel-card-frame">
                                                                <div className="kernel-card-portrait">
                                                                    <img
                                                                        src={
                                                                            portraitPath
                                                                        }
                                                                        alt={
                                                                            config?.displayName ?? "Kernel"
                                                                        }
                                                                        className="kernel-card-image"
                                                                        style={{
                                                                            filter: isUnlocked
                                                                                ? "drop-shadow(0 0 10px rgba(0,255,0,0.6))"
                                                                                : "grayscale(1) brightness(0.5)",
                                                                        }}
                                                                        onError={(
                                                                            e,
                                                                        ) => {
                                                                            (
                                                                                e.target as HTMLImageElement
                                                                            ).src =
                                                                                "/hero/hero-grade-1.svg";
                                                                        }}
                                                                    />
                                                                    {!isUnlocked && (
                                                                        <span
                                                                            className="kernel-card-lock"
                                                                            aria-hidden
                                                                        >
                                                                            LOCKED
                                                                        </span>
                                                                    )}
                                                                    {isEquipped && (
                                                                        <span
                                                                            className="kernel-card-badge"
                                                                            aria-hidden
                                                                        >
                                                                            ACTIVE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="kernel-card-info">
                                                                    <p className="kernel-card-name">
                                                                        {
                                                                            config?.displayName ?? "Kernel"
                                                                        }
                                                                    </p>
                                                                    <p className="kernel-card-status">
                                                                        {status}
                                                                    </p>
                                                                    <p className="kernel-card-cost">
                                                                        <img
                                                                            src="/coin.png"
                                                                            alt=""
                                                                            className="kernel-card-coin"
                                                                        />
                                                                        {config?.unlockCostCoins ?? 0}{" "}
                                                                        COINS
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                            </div>
                        
                    </section>

                    {/* Bottom panels: UNLOCKED SYSTEMS | SYSTEM DEPTH | CHAMPIONS */}
                    <section
                        className="bottom-panels-section"
                        aria-label="Unlocked systems, system depth, and champions"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                            {/* UNLOCKED SYSTEMS - horizontal row of icons */}
                            
                                <div className="retro-panel">
                                    <h2
                                        className="font-menu text-base md:text-lg mb-3 text-neon-green border-b-2 border-neon-green pb-2"
                                        style={{ letterSpacing: "0.1em" }}
                                    >
                                        UNLOCKED SYSTEMS
                                    </h2>
                                    <div className="unlocked-systems-circuit">
                                        <div className="circuit-node unlocked">
                                            <div className="circuit-node-icon">
                                                <img
                                                    src="/sprites/hero_2.svg"
                                                    alt=""
                                                    className="max-w-full max-h-full object-contain"
                                                    style={{
                                                        filter: "drop-shadow(0 0 3px #00ff00)",
                                                    }}
                                                />
                                            </div>
                                            <p className="font-menu text-[10px] text-neon-green">
                                                Prestige 2
                                            </p>
                                        </div>
                                        <div className="circuit-node unlocked">
                                            <div className="circuit-node-icon">
                                                <img
                                                    src="/sprites/drone.svg"
                                                    alt=""
                                                    className="max-w-full max-h-full object-contain"
                                                    style={{
                                                        filter: "drop-shadow(0 0 3px #00ff00)",
                                                    }}
                                                />
                                            </div>
                                            <p className="font-menu text-[10px] text-neon-green">
                                                Prestige 2
                                            </p>
                                        </div>
                                        {[1, 2, 3].map((item) => (
                                            <div
                                                key={item}
                                                className="circuit-node locked"
                                            >
                                                <div className="circuit-node-icon">
                                                    <span
                                                        className="text-sm opacity-70"
                                                        aria-hidden
                                                    >
                                                        🔒
                                                    </span>
                                                </div>
                                                <p className="font-menu text-[10px] text-gray-500">
                                                    Prestige {item + 2}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            

                            {/* SYSTEM DEPTH - numbered 1-5 boxes */}
                            
                                <div className="retro-panel">
                                    <h2
                                        className="font-menu text-base md:text-lg mb-3 text-neon-green border-b-2 border-neon-green pb-2"
                                        style={{ letterSpacing: "0.1em" }}
                                    >
                                        SYSTEM DEPTH
                                    </h2>
                                    <p className="font-body text-xs text-neon-green opacity-70 mb-2">
                                        PRESTIGE{" "}
                                        {(getCurrentRankFromStorage()
                                            ?.prestige ?? 0) + 1}
                                    </p>
                                    <div className="depth-gauge-vertical">
                                        {[1, 2, 3, 4, 5].map((num) => {
                                            const currentPrestige =
                                                (getCurrentRankFromStorage()
                                                    ?.prestige ?? 0) + 1;
                                            const isActive =
                                                num === currentPrestige;
                                            const isLocked =
                                                num > currentPrestige;
                                            const filled =
                                                num <= currentPrestige;
                                            return (
                                                <div
                                                    key={num}
                                                    className={`depth-gauge-bar ${filled ? "filled" : ""} ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`}
                                                    title={`Layer ${num}`}
                                                >
                                                    {isLocked && (
                                                        <span
                                                            className="absolute inset-0 flex items-center justify-center text-xs opacity-70"
                                                            aria-hidden
                                                        >
                                                            🔒
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="font-body text-[10px] text-neon-green opacity-70 text-center mt-2">
                                        BOOT SECTOR → KERNEL BREACH
                                    </p>
                                </div>
                            

                            {/* CHAMPIONS */}
                            
                                <div className="retro-panel">
                                    <h2
                                        className="font-menu text-base md:text-lg mb-3 text-neon-green border-b-2 border-neon-green pb-2"
                                        style={{ letterSpacing: "0.1em" }}
                                    >
                                        CHAMPIONS
                                    </h2>
                                    <div className="space-y-2">
                                        <div className="py-2 border-b border-neon-green/30">
                                            <div className="font-body text-[10px] text-neon-green opacity-70">
                                                SECTOR CHAMPION
                                            </div>
                                            <div className="font-score text-base text-neon-green">
                                                {topPlayer || "NONE"}
                                            </div>
                                        </div>
                                        <div className="py-2 border-b border-neon-green/30">
                                            <div className="font-body text-[10px] text-neon-green opacity-70">
                                                PREVIOUS
                                            </div>
                                            <div className="font-body text-xs text-neon-green opacity-50">
                                                Coming Soon
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            <div className="font-body text-[10px] text-neon-green opacity-70">
                                                STATUS
                                            </div>
                                            <div className="font-body text-xs text-green-500">
                                                ACTIVE
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                        </div>
                    </section>

                    {/* How To Play - minimal accordion */}
                    <section
                        className="how-to-play-section"
                        aria-label="How to play"
                    >
                        <details className="retro-panel mb-6">
                            <summary
                                className="font-menu text-sm text-neon-green cursor-pointer list-none pb-2 border-b border-neon-green/30"
                                style={{ letterSpacing: "0.1em" }}
                            >
                                HOW TO PLAY
                            </summary>
                            <p className="font-body text-xs text-neon-green opacity-90 mt-3">
                                WASD / Arrows to move, Space to fire. Survive
                                and score.{" "}
                                <Link
                                    to="/about"
                                    className="underline hover:text-red-500"
                                >
                                    More
                                </Link>
                            </p>
                        </details>
                    </section>
                </main>

                {/* Footer: single row with vertical separators */}
                <footer
                    className="landing-footer flex flex-wrap justify-center items-center gap-0 pt-4 pb-6 border-t border-neon-green/40"
                    role="contentinfo"
                >
                    <Link
                        to="/about"
                        className="footer-link font-menu text-sm text-neon-green hover:text-neon-green/90 transition-all"
                        style={{
                            letterSpacing: "0.1em",
                            textShadow: "0 0 6px rgba(0,255,0,0.5)",
                        }}
                    >
                        ABOUT
                    </Link>
                    <span
                        className="footer-sep text-neon-green/50 mx-2"
                        aria-hidden
                    >
                        |
                    </span>
                    <Link
                        to="/leaderboards"
                        className="footer-link font-menu text-sm text-neon-green hover:text-neon-green/90 transition-all"
                        style={{
                            letterSpacing: "0.1em",
                            textShadow: "0 0 6px rgba(0,255,0,0.5)",
                        }}
                    >
                        HALL OF FAME
                    </Link>
                    <span
                        className="footer-sep text-neon-green/50 mx-2"
                        aria-hidden
                    >
                        |
                    </span>
                    <button
                        type="button"
                        className="footer-link font-menu text-sm text-neon-green hover:text-neon-green/90 transition-all border-0 bg-transparent cursor-pointer"
                        style={{
                            letterSpacing: "0.1em",
                            textShadow: "0 0 6px rgba(0,255,0,0.5)",
                        }}
                        onClick={handleOpenSettings}
                    >
                        SETTINGS
                    </button>
                    <span
                        className="footer-sep text-neon-green/50 mx-2"
                        aria-hidden
                    >
                        |
                    </span>
                    <button
                        type="button"
                        className="footer-link font-menu text-sm text-neon-green hover:text-neon-green/90 transition-all border-0 bg-transparent cursor-pointer"
                        style={{
                            letterSpacing: "0.1em",
                            textShadow: "0 0 6px rgba(0,255,0,0.5)",
                        }}
                        onClick={handleOpenMarketplace}
                    >
                        MARKET
                    </button>
                    <span
                        className="footer-sep text-neon-green/50 mx-2"
                        aria-hidden
                    >
                        |
                    </span>
                    <button
                        type="button"
                        className="footer-link font-menu text-sm text-neon-green hover:text-neon-green/90 transition-all border-0 bg-transparent cursor-pointer"
                        style={{
                            letterSpacing: "0.1em",
                            textShadow: "0 0 6px rgba(0,255,0,0.5)",
                        }}
                        onClick={handleOpenMarketplace}
                    >
                        MARSTORES
                    </button>
                    <span
                        className="footer-sep text-neon-green/50 mx-2"
                        aria-hidden
                    >
                        |
                    </span>
                    <button
                        type="button"
                        className="footer-link font-body text-xs text-neon-green border-0 bg-transparent cursor-pointer px-2 py-1 hover:opacity-90 transition-all"
                        style={{ letterSpacing: "0.05em" }}
                        onClick={handleOpenWalletModal}
                    >
                        <span className="wallet-login-label">
                            {walletLabel}
                        </span>
                    </button>
                </footer>
            </div>

            {/* Ticker tape - bottom */}
            <div className="ticker-tape-wrap" role="marquee" aria-live="polite">
                <div className="ticker-tape-content">
                    {tickerText} {tickerText}
                </div>
            </div>

            {/* Wallet Connection Modal */}
            <WalletConnectionModal
                isOpen={showWalletModal}
                onClose={handleCloseModal}
                onAnonymous={handleAnonymous}
            />
            {showSettingsModal && (
                <div className="landing-modal-overlay">
                    <div className="retro-panel landing-modal-panel w-full max-w-2xl">
                        <h2
                            className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2"
                            style={{
                                letterSpacing: "0.1em",
                            }}
                        >
                            SETTINGS
                        </h2>
                        <div className="space-y-6 text-sm text-neon-green">
                            <div>
                                <div className="font-menu text-xs mb-2">
                                    DIFFICULTY
                                </div>
                                <select
                                    value={settings.difficulty}
                                    onChange={(event) =>
                                        setSettings({
                                            ...settings,
                                            difficulty: event.target
                                                .value as GameplaySettings["difficulty"],
                                        })
                                    }
                                    className="w-full bg-black border border-neon-green px-3 py-2 font-body"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="easy">Easy</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <div className="font-menu text-xs mb-2">
                                    ACCESSIBILITY
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                        {
                                            key: "colorBlindMode",
                                            label: "Color Blind Mode",
                                        },
                                        {
                                            key: "highContrast",
                                            label: "High Contrast UI",
                                        },
                                        {
                                            key: "dyslexiaFont",
                                            label: "Dyslexia-Friendly Font",
                                        },
                                        {
                                            key: "reduceMotion",
                                            label: "Reduce Motion",
                                        },
                                        {
                                            key: "reduceFlash",
                                            label: "Reduce Flash",
                                        },
                                    ].map((option) => (
                                        <label
                                            key={option.key}
                                            className="flex items-center gap-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    settings.accessibility[
                                                        option.key as keyof GameplaySettings["accessibility"]
                                                    ]
                                                }
                                                onChange={(event) =>
                                                    setSettings({
                                                        ...settings,
                                                        accessibility: {
                                                            ...settings.accessibility,
                                                            [option.key]:
                                                                event.target
                                                                    .checked,
                                                        },
                                                    })
                                                }
                                            />
                                            <span className="font-body">
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="font-menu text-xs mb-2">
                                    VISUAL
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label className="flex flex-col gap-2">
                                        <span>UI Scale</span>
                                        <select
                                            value={settings.visual.uiScale}
                                            onChange={(event) =>
                                                setSettings({
                                                    ...settings,
                                                    visual: {
                                                        ...settings.visual,
                                                        uiScale: Number(
                                                            event.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                            className="bg-black border border-neon-green px-3 py-2"
                                        >
                                            {CUSTOMIZABLE_SETTINGS.visual.uiScale.map(
                                                (value) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}x
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span>UI Opacity</span>
                                        <select
                                            value={settings.visual.uiOpacity}
                                            onChange={(event) =>
                                                setSettings({
                                                    ...settings,
                                                    visual: {
                                                        ...settings.visual,
                                                        uiOpacity: Number(
                                                            event.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                            className="bg-black border border-neon-green px-3 py-2"
                                        >
                                            {CUSTOMIZABLE_SETTINGS.visual.uiOpacity.map(
                                                (value) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span>Screen Shake</span>
                                        <select
                                            value={
                                                settings.visual
                                                    .screenShakeIntensity
                                            }
                                            onChange={(event) =>
                                                setSettings({
                                                    ...settings,
                                                    visual: {
                                                        ...settings.visual,
                                                        screenShakeIntensity:
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                    },
                                                })
                                            }
                                            className="bg-black border border-neon-green px-3 py-2"
                                        >
                                            {CUSTOMIZABLE_SETTINGS.visual.screenShakeIntensity.map(
                                                (value) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span>Grid Intensity</span>
                                        <select
                                            value={
                                                settings.visual.gridIntensity
                                            }
                                            onChange={(event) =>
                                                setSettings({
                                                    ...settings,
                                                    visual: {
                                                        ...settings.visual,
                                                        gridIntensity: Number(
                                                            event.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                            className="bg-black border border-neon-green px-3 py-2"
                                        >
                                            {CUSTOMIZABLE_SETTINGS.visual.gridIntensity.map(
                                                (value) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col md:flex-row gap-3 justify-end">
                            <button
                                className="retro-button font-menu text-sm px-6 py-3"
                                onClick={handleSaveSettings}
                            >
                                SAVE
                            </button>
                            <button
                                className="retro-button font-menu text-sm px-6 py-3"
                                onClick={handleCloseSettings}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showMarketplaceModal && (
                <div className="landing-modal-overlay">
                    <div className="retro-panel landing-modal-panel w-full max-w-xl">
                        <h2
                            className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2"
                            style={{
                                letterSpacing: "0.1em",
                            }}
                        >
                            MARKETPLACE
                        </h2>
                        <div className="text-sm font-body text-neon-green space-y-2">
                            <div className="flex items-center gap-2">
                                <img src="/coin.png" alt="coin" style={{ width: 22, height: 22, objectFit: 'contain', filter: 'drop-shadow(0 0 4px #00ff00)' }} />
                                <span>Available: <span className="font-score text-base font-bold">{coins}</span> coins</span>
                            </div>
                            <div className="text-xs opacity-60">Rate: 10 coins per 1 STRK</div>
                            {buyStatus !== 'idle' && (
                                <div className={`text-xs px-3 py-2 border ${
                                    buyStatus === 'pending' ? 'border-yellow-400 text-yellow-400' :
                                    buyStatus === 'success' ? 'border-neon-green text-neon-green' :
                                    'border-red-500 text-red-500'
                                }`}>
                                    {buyStatusMsg}
                                </div>
                            )}
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            {[
                                { amount: 100,  label: '100 Coins',  strk: '10 STRK' },
                                { amount: 200,  label: '200 Coins',  strk: '20 STRK' },
                                { amount: 500,  label: '500 Coins',  strk: '50 STRK' },
                                { amount: 1000, label: '1000 Coins', strk: '100 STRK' },
                            ].map((item) => (
                                <button
                                    key={item.amount}
                                    className={`retro-button font-menu text-sm px-4 py-3 ${
                                        buyStatus === 'pending' ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    onClick={() => handleBuyCoins(item.amount)}
                                    disabled={buyStatus === 'pending'}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        <img src="/coin.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                                        {item.label}
                                    </span>
                                    <span className="block text-xs opacity-70 mt-0.5">{item.strk}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                className="retro-button font-menu text-sm px-6 py-3"
                                onClick={handleCloseMarketplace}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <AvatarSelectionModal
                isOpen={showAvatarModal}
                onClose={handleCloseAvatarModal}
                onAvatarChange={handleAvatarChange}
            />
            <InventoryModal
                isOpen={showInventoryModal}
                onClose={() => setShowInventoryModal(false)}
                onActivate={(type) => {
                    // Mini-me activation will be handled by GameScene when game is running
                    console.log("Mini-me activated:", type);
                }}
            />
            <PregameUpgradesModal
                isOpen={showPregameModal}
                onClose={() => setShowPregameModal(false)}
                kernel={(() => {
                    const avatarIds = ['default_sentinel', 'swift_interceptor', 'artillery_unit', 'guardian_core', 'sniper_kernel', 'assault_nexus', 'neon_guardian', 'void_sentinel', 'plasma_core', 'prime_sentinel', 'transcendent_form'];
                    const idx = avatarIds.indexOf(activeAvatar);
                    return idx === -1 ? 0 : idx;
                })()}
            />
        </div>
    );
}

export default LandingPage;
