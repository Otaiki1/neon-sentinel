import React from "react";
import "./TxLoadingModal.css";

interface TxLoadingModalProps {
    visible: boolean;
    message?: string;
}

const TxLoadingModal: React.FC<TxLoadingModalProps> = ({
    visible,
    message = "Processing transaction…",
}) => {
    if (!visible) return null;

    return (
        <div className="tx-overlay">
            {/* Scanlines */}
            <div className="tx-scanlines" />

            {/* Terminal panel */}
            <div className="tx-panel">
                {/* Terminal header bar */}
                <div className="tx-header">
                    <span className="tx-dot red" />
                    <span className="tx-dot yellow" />
                    <span className="tx-dot green" />
                    <span className="tx-header-title">NEON_SENTINEL // TX_ENGINE v1.0</span>
                </div>

                {/* Hero + battlefield */}
                <div className="tx-arena">
                    {/* Scrolling grid floor */}
                    <div className="tx-grid-floor" />

                    {/* Hero character, faces right and bobs */}
                    <div className="tx-hero-wrap">
                        <img
                            src="/hero/hero-god-mode.svg"
                            alt="Neon Sentinel"
                            className="tx-hero"
                        />
                        {/* Muzzle flash */}
                        <div className="tx-muzzle" />
                    </div>

                    {/* Bullets shot from the hero */}
                    <div className="tx-bullet tx-bullet-1" />
                    <div className="tx-bullet tx-bullet-2" />
                    <div className="tx-bullet tx-bullet-3" />

                    {/* Target reticle dissolves at the right edge */}
                    <div className="tx-reticle">
                        <div className="tx-reticle-ring" />
                        <div className="tx-reticle-cross h" />
                        <div className="tx-reticle-cross v" />
                    </div>
                </div>

                {/* Terminal log */}
                <div className="tx-log">
                    <p className="tx-log-line">
                        <span className="tx-prompt">&gt;_&nbsp;</span>
                        <span className="tx-typewriter">{message}</span>
                    </p>
                    <p className="tx-log-line dim">
                        <span className="tx-prompt">&gt;_&nbsp;</span>
                        AWAITING ON-CHAIN CONFIRMATION…
                    </p>
                    <p className="tx-log-line dim blink-slow">
                        <span className="tx-prompt">&gt;_&nbsp;</span>
                        DO NOT CLOSE THIS WINDOW
                    </p>
                </div>

                {/* Progress bar */}
                <div className="tx-progress-bar">
                    <div className="tx-progress-fill" />
                </div>

                {/* Status line */}
                <div className="tx-status">
                    <span className="tx-dot-pulse" />
                    <span className="tx-status-text">TRANSMITTING</span>
                </div>
            </div>
        </div>
    );
};

export default TxLoadingModal;
