import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { initGame } from "../game/Game";
import { getGameplaySettings } from "../services/settingsService";
import { getAvailableCoins } from "../services/coinService";
import { mergePregameEffects } from "../services/pregameUpgradeService";
import type { PregameUpgradeId } from "../services/pregameUpgradeService";
import { InventoryModal } from "../components/InventoryModal";
import { DialogueCard } from "../components/DialogueCard";
import { VictoryScreen } from "../components/VictoryScreen";
import CommanderWalkthrough from "../components/CommanderWalkthrough";
import type { MiniMeType } from "../services/inventoryService";
import "./GamePage.css";

function GamePage() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const { address, account } = useAccount();
    const navigate = useNavigate();
    const location = useLocation();
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [currentDialogue, setCurrentDialogue] = useState<{
        id: string;
        speaker: string;
        text: string;
        speakerColor: string;
    } | null>(null);
    const [showVictoryScreen, setShowVictoryScreen] = useState(false);
    const [isWalkthroughActive, setIsWalkthroughActive] = useState(() => {
        return localStorage.getItem("neon-sentinel-game-walkthrough-seen") !== "true";
    });

    useEffect(() => {
        if (!gameContainerRef.current) return;

        const updateViewportSize = () => {
            if (!gameContainerRef.current) return;
            const viewport = window.visualViewport;
            const containerRect = gameContainerRef.current.getBoundingClientRect();
            let newWidth = viewport?.width || containerRect.width || window.innerWidth || 800;
            let newHeight = viewport?.height || containerRect.height || window.innerHeight || 600;
            
            // Ensure minimum valid dimensions (WebGL requires at least 1x1)
            newWidth = Math.max(1, Math.floor(newWidth));
            newHeight = Math.max(1, Math.floor(newHeight));
            
            gameContainerRef.current.style.width = `${newWidth}px`;
            gameContainerRef.current.style.height = `${newHeight}px`;
            if (gameInstanceRef.current) {
                // Only resize if dimensions are valid
                if (newWidth > 0 && newHeight > 0) {
                    gameInstanceRef.current.scale.resize(newWidth, newHeight);
                }
            }
        };

        // Initialize Phaser game
        updateViewportSize();
        const game = initGame(gameContainerRef.current);
        gameInstanceRef.current = game;
        const settings = getGameplaySettings();
        game.registry.set("gameplaySettings", settings);
        game.registry.set("coins", getAvailableCoins());
        const pregameIds = (location.state as { pregameUpgrades?: PregameUpgradeId[] } | null)?.pregameUpgrades ?? [];
        const pregameEffects = mergePregameEffects(pregameIds);
        game.registry.set("pregameSessionEffects", pregameEffects);

        // Load the cached run ID (written by PregameUpgradesModal / AnswerGauntletModal after tx confirmed)
        const cachedRunId = sessionStorage.getItem("activeRunId");
        if (cachedRunId) {
            game.registry.set("activeRunId", cachedRunId);
            // NOTE: do NOT remove from sessionStorage here — React StrictMode can double-mount
            // GameScene will clear it from sessionStorage after successful on-chain submission
            console.log("[GamePage] Loaded cached activeRunId:", cachedRunId);
        }

        // Gauntlet mode context (written by AnswerGauntletModal)
        const gauntletBeaconId = sessionStorage.getItem("gauntletBeaconId");
        const isGauntletRun = sessionStorage.getItem("isGauntletRun") === "true";
        if (isGauntletRun && gauntletBeaconId) {
            game.registry.set("isGauntletRun", true);
            game.registry.set("gauntletBeaconId", gauntletBeaconId);
            console.log("[GamePage] Gauntlet run detected, beaconId:", gauntletBeaconId);
        }

        // Listen for return to menu event
        const handleReturnToMenu = () => {
            navigate("/");
        };

        // Expose navigation function to game
        (game as any).returnToMenu = handleReturnToMenu;
        
        // Pause game if walkthrough is active
        if (isWalkthroughActive) {
            // Need a fast loop because the scene might not be fully initialized when this runs
            const pauseInterval = setInterval(() => {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene && gameScene.scene.isActive()) {
                    gameScene.scene.pause();
                    clearInterval(pauseInterval);
                }
            }, 50);
            
            // Cleanup timeout to prevent infinite looping just in case
            setTimeout(() => clearInterval(pauseInterval), 5000);
        }
        
        // Listen for inventory open on game's global events (so it works from pause menu regardless of scene timing)
        game.events.on('open-inventory', () => {
            setShowInventoryModal(true);
            game.registry.set('inventoryModalOpen', true);
        });

        // Listen for dialogue and other events from UIScene
        const uiScene = game.scene.getScene('UIScene');
        if (uiScene) {
            uiScene.events.on('show-dialogue', (data: {
                id: string;
                speaker: string;
                text: string;
                speakerColor: string;
            }) => {
                setCurrentDialogue(data);
            });
            
            uiScene.events.on('final-boss-victory', () => {
                setShowVictoryScreen(true);
            });
        }

        // Handle window resize / orientation
        window.addEventListener("resize", updateViewportSize);
        window.addEventListener("orientationchange", updateViewportSize);
        window.visualViewport?.addEventListener("resize", updateViewportSize);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("resize", updateViewportSize);
            window.removeEventListener("orientationchange", updateViewportSize);
            window.visualViewport?.removeEventListener(
                "resize",
                updateViewportSize
            );
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, [navigate]);

    // Expose wallet address and account to game scenes via game registry
    useEffect(() => {
        if (gameInstanceRef.current) {
            if (address) {
                gameInstanceRef.current.registry.set("walletAddress", address);
                gameInstanceRef.current.registry.set("starknetAccount", account);
            } else {
                gameInstanceRef.current.registry.set("walletAddress", undefined);
                gameInstanceRef.current.registry.set("starknetAccount", undefined);
            }
        }
    }, [address, account]);

    const handleMiniMeActivate = (type: MiniMeType) => {
        // Spawn mini-me in game
        if (gameInstanceRef.current) {
            const gameScene = gameInstanceRef.current.scene.getScene('GameScene') as any;
            if (gameScene && typeof gameScene.spawnMiniMe === 'function') {
                gameScene.spawnMiniMe(type);
            }
        }
    };

    const handleWalkthroughComplete = () => {
        setIsWalkthroughActive(false);
        if (gameInstanceRef.current) {
            const gameScene = gameInstanceRef.current.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isPaused()) {
                gameScene.scene.resume();
            }
        }
    };

    return (
        <div className="game-page-container">
            <div ref={gameContainerRef} className="game-container" />
            
            {isWalkthroughActive && (
                <div style={{ position: "absolute", zIndex: 1000, inset: 0 }}>
                    <CommanderWalkthrough type="game" onComplete={handleWalkthroughComplete} />
                </div>
            )}
            
            <InventoryModal
                isOpen={showInventoryModal}
                onClose={() => {
                    setShowInventoryModal(false);
                    if (gameInstanceRef.current) {
                        gameInstanceRef.current.registry.set('inventoryModalOpen', false);
                    }
                }}
                onActivate={handleMiniMeActivate}
                onSessionsChanged={(newCount) => {
                    if (gameInstanceRef.current) {
                        gameInstanceRef.current.registry.set('miniMeSessionsRemaining', newCount);
                    }
                }}
            />
            {currentDialogue && (
                <DialogueCard
                    speaker={currentDialogue.speaker}
                    text={currentDialogue.text}
                    speakerColor={currentDialogue.speakerColor}
                    onDismiss={() => setCurrentDialogue(null)}
                    autoDismiss={true}
                    dismissDelay={5000}
                    typewriterSpeed={100}
                />
            )}
            <VictoryScreen
                isVisible={showVictoryScreen}
                onClose={() => setShowVictoryScreen(false)}
            />
        </div>
    );
}

export default GamePage;
