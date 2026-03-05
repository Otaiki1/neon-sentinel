import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect } from "@starknet-react/core";
import type { Connector } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import "./WalletConnectionModal.css";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnonymous: () => void;
}

function WalletConnectionModal({ isOpen, onClose, onAnonymous }: WalletConnectionModalProps) {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const [isConnecting, setIsConnecting] = useState(false);

  // Close modal if wallet gets connected
  useEffect(() => {
    if (address && isOpen) {
      onClose();
    }
  }, [address, isOpen, onClose]);

  const controller = useMemo(() => {
    return connectors.find((c) => c.id === "controller") as ControllerConnector | undefined;
  }, [connectors]);

  if (!isOpen) return null;

  const handleConnectWallet = async () => {
    if (!controller) return;
    setIsConnecting(true);
    try {
      await Promise.resolve(connect({ connector: controller }));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2 className="wallet-modal-title font-menu text-2xl text-neon-green" style={{ letterSpacing: '0.1em' }}>
            CONNECT TO GRID
          </h2>
          <button 
            className="wallet-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="wallet-modal-body">
          <p className="font-body text-base text-neon-green mb-6 opacity-90">
            Connect your wallet to participate in challenges, claim rewards, and see your scores on the leaderboard.
          </p>

          <div className="wallet-modal-buttons">
            <button 
              className="wallet-modal-button wallet-modal-button-primary retro-button font-logo text-lg px-8 py-4"
              onClick={handleConnectWallet}
              disabled={isConnecting || !controller}
            >
              {isConnecting ? 'CONNECTING...' : '>> CONNECT WALLET <<'}
            </button>

            <div className="wallet-modal-divider">
              <span className="font-body text-sm text-neon-green opacity-60">OR</span>
            </div>

            <button 
              className="wallet-modal-button wallet-modal-button-secondary font-menu text-base px-6 py-3"
              onClick={onAnonymous}
            >
              PLAY AS ANONYMOUS
            </button>
          </div>

          <div className="wallet-modal-warning">
            <div className="font-body text-sm text-red-500 mb-3" style={{ letterSpacing: '0.05em' }}>
              ⚠️ ANONYMOUS MODE LIMITATIONS:
            </div>
            <ul className="wallet-modal-warning-list font-body text-xs text-neon-green opacity-80 space-y-2">
              <li>• Your scores will be hidden from the leaderboard</li>
              <li>• You cannot participate in challenges</li>
              <li>• You cannot claim rewards at the end</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletConnectionModal;

