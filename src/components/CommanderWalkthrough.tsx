import React, { useEffect, useRef, useState } from 'react';
import './CommanderWalkthrough.css';

interface CommanderWalkthroughProps {
    onComplete: () => void;
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

const WALKTHROUGH_SEEN_KEY = "neon-sentinel-walkthrough-seen";

const CommanderWalkthrough: React.FC<CommanderWalkthroughProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const intervalRef = useRef<number | null>(null);

    // Initial check if we should show
    useEffect(() => {
        const hasSeen = localStorage.getItem(WALKTHROUGH_SEEN_KEY) === "true";
        if (!hasSeen) {
            setIsVisible(true);
        } else {
            onComplete();
        }
    }, [onComplete]);

    // Typing effect for current step
    useEffect(() => {
        if (!isVisible) return;

        const currentText = DIALOG_STEPS[step].text;
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
            if (step < DIALOG_STEPS.length - 1) {
                setStep(step + 1);
            } else {
                finishWalkthrough();
            }
        }
    };

    const finishWalkthrough = () => {
        setIsVisible(false);
        localStorage.setItem(WALKTHROUGH_SEEN_KEY, "true");
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
                            {DIALOG_STEPS[step].title}
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
                            STEP 0{step + 1} / 0{DIALOG_STEPS.length}
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
                                {isTyping ? "SKIP TYPE" : (step === DIALOG_STEPS.length - 1 ? "ACKNOWLEDGE" : "NEXT >")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommanderWalkthrough;
