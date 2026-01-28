/**
 * DialogueCard - React component for displaying dialogue
 * 
 * Displays character dialogue with typewriter effect, auto-dismiss, and click-to-skip
 */

import React, { useState, useEffect, useRef } from 'react';
import './DialogueCard.css';

export interface DialogueCardProps {
    speaker: string;
    text: string;
    speakerColor?: string;
    onDismiss?: () => void;
    autoDismiss?: boolean;
    dismissDelay?: number;
    typewriterSpeed?: number;
}

export const DialogueCard: React.FC<DialogueCardProps> = ({
    speaker,
    text,
    speakerColor = '#00ff00',
    onDismiss,
    autoDismiss = true,
    dismissDelay = 5000,
    typewriterSpeed = 100,
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
    const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(0);

    // Typewriter effect
    useEffect(() => {
        if (currentIndexRef.current < text.length) {
            typewriterTimerRef.current = setTimeout(() => {
                setDisplayedText(text.slice(0, currentIndexRef.current + 1));
                currentIndexRef.current += 1;
            }, typewriterSpeed);
        } else {
            setIsComplete(true);
            // Start auto-dismiss timer after typewriter completes
            if (autoDismiss && onDismiss) {
                dismissTimerRef.current = setTimeout(() => {
                    handleDismiss();
                }, dismissDelay);
            }
        }

        return () => {
            if (typewriterTimerRef.current) {
                clearTimeout(typewriterTimerRef.current);
            }
            if (dismissTimerRef.current) {
                clearTimeout(dismissTimerRef.current);
            }
        };
    }, [text, displayedText, autoDismiss, dismissDelay, onDismiss, typewriterSpeed]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) {
            // Small delay for fade-out animation
            setTimeout(() => {
                onDismiss();
            }, 300);
        }
    };

    const handleClick = () => {
        if (isComplete) {
            handleDismiss();
        } else {
            // Skip typewriter effect
            setDisplayedText(text);
            setIsComplete(true);
            if (dismissTimerRef.current) {
                clearTimeout(dismissTimerRef.current);
            }
            if (autoDismiss && onDismiss) {
                dismissTimerRef.current = setTimeout(() => {
                    handleDismiss();
                }, dismissDelay);
            }
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`dialogue-card ${isComplete ? 'complete' : ''}`}
            onClick={handleClick}
            style={{ '--speaker-color': speakerColor } as React.CSSProperties}
        >
            <div className="dialogue-card-background" />
            <div className="dialogue-card-content">
                <div className="dialogue-card-header">
                    <span className="dialogue-card-icon">⚡</span>
                    <span className="dialogue-card-speaker">{speaker.toUpperCase()}</span>
                </div>
                <div className="dialogue-card-text">
                    {displayedText}
                    {!isComplete && <span className="dialogue-card-cursor">|</span>}
                </div>
                {isComplete && (
                    <div className="dialogue-card-hint">Click to continue</div>
                )}
            </div>
        </div>
    );
};
