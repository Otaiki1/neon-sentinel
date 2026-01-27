/**
 * VictoryScreen - React component for Prime Sentinel victory screen
 * 
 * Displays victory cutscene and Prime Sentinel promotion
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VictoryScreen.css';

export interface VictoryScreenProps {
    isVisible: boolean;
    onClose?: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ isVisible, onClose }) => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<'fade-in' | 'dialogue' | 'transformation' | 'complete'>('fade-in');
    const [showDialogue, setShowDialogue] = useState(false);

    useEffect(() => {
        if (!isVisible) {
            setPhase('fade-in');
            setShowDialogue(false);
            return;
        }

        // Phase 1: Fade in
        const fadeInTimer = setTimeout(() => {
            setPhase('dialogue');
            setShowDialogue(true);
        }, 1000);

        // Phase 2: Show dialogue
        const dialogueTimer = setTimeout(() => {
            setPhase('transformation');
        }, 5000);

        // Phase 3: Transformation
        const transformTimer = setTimeout(() => {
            setPhase('complete');
        }, 3000);

        return () => {
            clearTimeout(fadeInTimer);
            clearTimeout(dialogueTimer);
            clearTimeout(transformTimer);
        };
    }, [isVisible]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`victory-screen ${phase}`}>
            <div className="victory-background" />
            <div className="victory-content">
                {phase === 'fade-in' && (
                    <div className="victory-fade-in">
                        <div className="victory-title">VICTORY</div>
                    </div>
                )}
                
                {phase === 'dialogue' && showDialogue && (
                    <div className="victory-dialogue">
                        <div className="dialogue-card">
                            <div className="dialogue-speaker">PRIME SENTINEL</div>
                            <div className="dialogue-text">
                                Rise, Sentinel. You have liberated Terminal Neon. You are now Prime Sentinel - Rank: Prime Sentinel.
                            </div>
                        </div>
                    </div>
                )}
                
                {phase === 'transformation' && (
                    <div className="victory-transformation">
                        <div className="transformation-text">TRANSFORMING...</div>
                        <div className="transformation-glow" />
                    </div>
                )}
                
                {phase === 'complete' && (
                    <div className="victory-complete">
                        <div className="victory-title-large">PRIME SENTINEL</div>
                        <div className="victory-subtitle">Terminal Neon is liberated. You have ascended beyond Sentinel.</div>
                        <div className="victory-message">
                            You are Prime Sentinel now. Legendary status achieved.
                        </div>
                        <div className="victory-rewards">
                            <div className="reward-item">✓ Achievement: Prime Sentinel</div>
                            <div className="reward-item">✓ Rank: Prime Sentinel (Rank 18)</div>
                            <div className="reward-item">✓ Avatar Unlock: Transcendent Form</div>
                            <div className="reward-item">✓ Badge: Prime Sentinel</div>
                        </div>
                        <div className="victory-actions">
                            <button
                                className="victory-button"
                                onClick={() => {
                                    if (onClose) {
                                        onClose();
                                    }
                                    navigate('/');
                                }}
                            >
                                RETURN TO TERMINAL
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
