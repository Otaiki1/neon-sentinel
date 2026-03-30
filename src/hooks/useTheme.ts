import { useState, useEffect } from "react";

export type Theme = "default" | "haywire";

const STORAGE_KEY = "neon-sentinel-theme";

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return stored === "haywire" ? "haywire" : "default";
    });

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Apply on mount immediately (before React hydrates)
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored) applyTheme(stored);
    }, []);

    const toggleTheme = () =>
        setTheme((t) => (t === "haywire" ? "default" : "haywire"));

    return { theme, toggleTheme };
}
