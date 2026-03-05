import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { 
    getPlayerProfileOnChain, 
    getMiniMeInventory, 
    getCoinPurchases,
    normalizeAddress
} from "../services/dojoService";

interface DojoContextType {
    profile: any | null;
    inventory: any[] | null;
    purchases: any[] | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
}

const DojoContext = createContext<DojoContextType | undefined>(undefined);

export const DojoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { address, isConnected } = useAccount();
    const [profile, setProfile] = useState<any | null>(null);
    const [inventory, setInventory] = useState<any[] | null>(null);
    const [purchases, setPurchases] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshProfile = async () => {
        if (!address) return;
        const normalized = normalizeAddress(address);
        setLoading(true);
        try {
            const [onChainProfile, onChainInventory, onChainPurchases] = await Promise.all([
                getPlayerProfileOnChain(normalized),
                getMiniMeInventory(normalized),
                getCoinPurchases(normalized)
            ]);
            
            setProfile(onChainProfile);
            setInventory(onChainInventory);
            setPurchases(onChainPurchases);
            setError(null);
        } catch (err: any) {
            console.error("Error refreshing Dojo profile data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
        <DojoContext.Provider value={{ profile, inventory, purchases, loading, error, refreshProfile }}>
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
