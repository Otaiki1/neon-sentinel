import React, { useEffect, useRef, useState } from 'react';
import './CommanderWalkthrough.css';

interface CommanderWalkthroughProps {
    onComplete: () => void;
    type?: "landing" | "game";
}

const DIALOG_STEPS = [
    {
        title: "SYSTEM TRANSMISSION",
        text: "Wake up, Sentinel. I am Commander Vega. I will guide you through your dashboard initialization.",
    },
    {
        title: "COMMAND CENTER",
        text: "Your interconnected grid terminal. Access your PROFILE to view your service record. The HALL displays global LEADERBOARDS of elite operatives.",
    },
    {
        title: "RESOURCE PROCUREMENT",
        text: "The MARKET is where you synchronize STRK to acquire Neon Coins. Necessary for surviving the outer grid.",
    },
    {
        title: "ARSENAL MANAGEMENT",
        text: "Use your INVENTORY to equip avatars and tactical upgrades. Prepare your loadout before every mission.",
    },
    {
        title: "COMBAT DEPLOYMENT",
        text: "When parameters are set and weapons hot, initiate the LAUNCH sequence to deploy into the Neon Grid. Good hunting.",
    }
];

const GAME_DIALOG_STEPS = [
    {
        title: "COMBAT HUD INITIALIZED",
        text: "Grid deployed. Your Sentinel is online. Use Arrow Keys to move and spacebar or click to fire, on mobile use on screen controls.",
    },
    {
        title: "TACTICAL ADVANTAGE",
        text: "Defeated enemies may drop power-ups. Collect them to enhance your firepower, restore health, or gain temporary advantages.",
    },
    {
        title: "SYSTEM ABILITIES",
        text: "If you need a moment, press ESC or use the Pause button. Use Q for God Mode, and B for Shock Bomb once unlocked.",
    },
    {
        title: "SUPPORT UNITS",
        text: "Equipped Mini-Mes provide tactical support. Press Tab or the Inventory button to pause, open your inventory, and select a Mini-Me to deploy. You can also press M to quickly activate your selected Mini-Me.",
    },
    {
        title: "PERFORMANCE METRICS",
        text: "Defeating enemies increases your Score and Combo multiplier. A higher Combo means more points. Take damage, and your Combo resets.",
    },
    {
        title: "SURVIVAL PROTOCOLS",
        text: "Stay moving to avoid being surrounded. Prioritize targets. Your mission is to survive and eliminate corrupted code. Go get 'em, Sentinel.",
    }
];

const WALKTHROUGH_SEEN_KEY = "neon-sentinel-walkthrough-seen";
const GAME_WALKTHROUGH_SEEN_KEY = "neon-sentinel-game-walkthrough-seen";

const CommanderWalkthrough: React.FC<CommanderWalkthroughProps> = ({ onComplete, type = "landing" }) => {
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const intervalRef = useRef<number | null>(null);

    // Initial check if we should show
    useEffect(() => {
        const key = type === "landing" ? WALKTHROUGH_SEEN_KEY : GAME_WALKTHROUGH_SEEN_KEY;
        const hasSeen = localStorage.getItem(key) === "true";
        if (!hasSeen) {
            setIsVisible(true);
        } else {
            onComplete();
        }
    }, [onComplete]);

    // Typing effect for current step
    useEffect(() => {
        if (!isVisible) return;

        const steps = type === "landing" ? DIALOG_STEPS : GAME_DIALOG_STEPS;
        const currentText = steps[step].text;
        setTypedText('');
        setIsTyping(true);

        let index = 0;
        intervalRef.current = window.setInterval(() => {
            index++;
            setTypedText(currentText.slice(0, index));

            if (index >= currentText.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsTyping(false);
            }
        }, 22); // typing speed

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [step, isVisible]);

    if (!isVisible) return null;

    const handleNext = () => {
        if (isTyping) {
            // Speed up / skip typing
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTypedText(DIALOG_STEPS[step].text);
            setIsTyping(false);
        } else {
            // Advance to next step or finish
            const steps = type === "landing" ? DIALOG_STEPS : GAME_DIALOG_STEPS;
            if (step < steps.length - 1) {
                setStep(step + 1);
            } else {
                finishWalkthrough();
            }
        }
    };

    const finishWalkthrough = () => {
        setIsVisible(false);
        const key = type === "landing" ? WALKTHROUGH_SEEN_KEY : GAME_WALKTHROUGH_SEEN_KEY;
        localStorage.setItem(key, "true");
        onComplete();
    };

    return (
        <div className="walkthrough-overlay">
            <div className="walkthrough-panel">
                {/* Visual Commander Portrait */}
                <div className="walkthrough-portrait">
                    <img src="/white-sentinel.png" alt="Commander Vega" className="commander-img" />
                    <div className="portrait-scanline" />
                </div>

                {/* Dialog Content */}
                <div className="walkthrough-content">
                    <div className="walkthrough-header flex items-center gap-2">
                        <span className="Walkthrough-dot red" />
                        <span className="Walkthrough-dot yellow" />
                        <span className="Walkthrough-dot green" />
                        <span className="walkthrough-title font-menu text-xs text-neon-green tracking-widest ml-2">
                            {type === "landing" ? DIALOG_STEPS[step].title : GAME_DIALOG_STEPS[step].title}
                        </span>
                    </div>

                    <div className="walkthrough-body font-body text-sm mt-3 flex-1">
                        <p className="text-neon-green leading-relaxed text-shadow-neon">
                            {typedText}
                            {isTyping && <span className="walkthrough-cursor" />}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="walkthrough-actions flex items-center justify-between mt-4 border-t border-neon-green border-opacity-30 pt-3">
                        <div className="text-xs text-neon-green opacity-50 font-menu tracking-wider">
                            STEP 0{step + 1} / 0{type === "landing" ? DIALOG_STEPS.length : GAME_DIALOG_STEPS.length}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={finishWalkthrough}
                                className="font-menu text-xs tracking-widest text-[#ff3b30] hover:text-[#ff6b62] transition-colors"
                            >
                                SKIP WALKTHROUGH
                            </button>
                            <button
                                onClick={handleNext}
                                className="retro-button font-menu text-xs px-6 py-2"
                            >
                                {isTyping ? "SKIP TYPE" : (step === (type === "landing" ? DIALOG_STEPS.length : GAME_DIALOG_STEPS.length) - 1 ? "ACKNOWLEDGE" : "NEXT >")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommanderWalkthrough;
