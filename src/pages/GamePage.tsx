import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { initGame } from "../game/Game";
import { getGameplaySettings } from "../services/settingsService";
import { getAvailableCoins } from "../services/coinService";
import "./GamePage.css";

function GamePage() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const { primaryWallet } = useDynamicContext();
    const navigate = useNavigate();

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

        // Listen for return to menu event
        const handleReturnToMenu = () => {
            navigate("/");
        };

        // Expose navigation function to game
        (game as any).returnToMenu = handleReturnToMenu;

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

    // Expose wallet address to game scenes via game registry
    useEffect(() => {
        if (gameInstanceRef.current && primaryWallet) {
            const walletAddress = primaryWallet.address;
            gameInstanceRef.current.registry.set(
                "walletAddress",
                walletAddress
            );
        } else if (gameInstanceRef.current) {
            gameInstanceRef.current.registry.set("walletAddress", undefined);
        }
    }, [primaryWallet]);

    return (
        <div className="game-page-container">
            <div ref={gameContainerRef} className="game-container" />
        </div>
    );
}

export default GamePage;
