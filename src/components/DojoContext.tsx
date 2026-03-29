import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import {
    getPlayerProfileOnChain,
    getMiniMeInventory,
    getCoinPurchases,
    normalizeAddress,
} from "../services/dojoService";
import TxLoadingModal from "./TxLoadingModal";

interface DojoContextType {
    profile: any | null;
    inventory: any[] | null;
    purchases: any[] | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    /** Show the global transaction loading overlay */
    showTx: (message?: string) => void;
    /** Hide the global transaction loading overlay */
    hideTx: () => void;
}

const DojoContext = createContext<DojoContextType | undefined>(undefined);

export const DojoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { address, isConnected } = useAccount();
    const [profile, setProfile] = useState<any | null>(null);
    const [inventory, setInventory] = useState<any[] | null>(null);
    const [purchases, setPurchases] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Global TX overlay ───────────────────────────────────
    const [txVisible, setTxVisible] = useState(false);
    const [txMessage, setTxMessage] = useState("Processing transaction…");

    const showTx = useCallback((message = "Processing transaction…") => {
        setTxMessage(message);
        setTxVisible(true);
    }, []);

    const hideTx = useCallback(() => {
        setTxVisible(false);
    }, []);

    // ── Profile fetch ───────────────────────────────────────
    const refreshProfile = useCallback(async () => {
        if (!address) return;
        const normalized = normalizeAddress(address);
        setLoading(true);
        try {
            const [onChainProfile, onChainInventory, onChainPurchases] = await Promise.all([
                getPlayerProfileOnChain(normalized),
                getMiniMeInventory(normalized),
                getCoinPurchases(normalized),
            ]);
            setProfile(onChainProfile);
            setInventory(onChainInventory);
            setPurchases(onChainPurchases);
            setError(null);
        } catch (err: any) {
            // Torii not yet synced — suppress error, data will load once Torii indexes the world
            console.warn("[Torii] Profile data not available yet:", err?.message ?? err);
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (isConnected && address) {
            refreshProfile();
        } else {
            setProfile(null);
            setInventory(null);
            setPurchases(null);
        }
    }, [address, isConnected]);

    return (
        <DojoContext.Provider value={{ profile, inventory, purchases, loading, error, refreshProfile, showTx, hideTx }}>
            {/* Global transaction loading modal — shown for any on-chain call except end_run */}
            <TxLoadingModal visible={txVisible} message={txMessage} />
            {children}
        </DojoContext.Provider>
    );
};

export const useDojo = () => {
    const context = useContext(DojoContext);
    if (!context) {
        throw new Error("useDojo must be used within a DojoProvider");
    }
    return context;
};
