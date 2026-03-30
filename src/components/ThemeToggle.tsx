import { useTheme } from "../hooks/useTheme";
import "./ThemeToggle.css";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isHaywire = theme === "haywire";

    return (
        <button
            className={`theme-toggle ${isHaywire ? "theme-toggle--haywire" : "theme-toggle--default"}`}
            onClick={toggleTheme}
            title={isHaywire ? "Switch to Normal mode" : "Switch to Chaos mode"}
            aria-label="Toggle theme"
        >
            <span className="theme-toggle-icon">{isHaywire ? "◈" : "◈"}</span>
            <span className="theme-toggle-label">
                {isHaywire ? "NORMAL" : "CHAOS"}
            </span>
        </button>
    );
}
