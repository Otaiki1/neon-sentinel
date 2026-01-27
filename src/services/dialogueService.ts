/**
 * Dialogue Service - Manages dialogue persistence and tracking
 * 
 * Tracks viewed dialogues to prevent duplicate displays
 */

const VIEWED_DIALOGUES_KEY = 'neonSentinel_viewedDialogues';

/**
 * Get all viewed dialogue IDs
 */
export function getViewedDialogues(): string[] {
    try {
        const stored = localStorage.getItem(VIEWED_DIALOGUES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load viewed dialogues:', error);
    }
    return [];
}

/**
 * Mark a dialogue as viewed
 */
export function markDialogueAsViewed(dialogueId: string): void {
    try {
        const viewed = getViewedDialogues();
        if (!viewed.includes(dialogueId)) {
            viewed.push(dialogueId);
            localStorage.setItem(VIEWED_DIALOGUES_KEY, JSON.stringify(viewed));
        }
    } catch (error) {
        console.error('Failed to mark dialogue as viewed:', error);
    }
}

/**
 * Check if a dialogue has been viewed
 */
export function hasViewedDialogue(dialogueId: string): boolean {
    return getViewedDialogues().includes(dialogueId);
}

/**
 * Clear all viewed dialogues (for testing/reset)
 */
export function clearViewedDialogues(): void {
    try {
        localStorage.removeItem(VIEWED_DIALOGUES_KEY);
    } catch (error) {
        console.error('Failed to clear viewed dialogues:', error);
    }
}

/**
 * Check if first run (no dialogues viewed)
 */
export function isFirstRun(): boolean {
    return getViewedDialogues().length === 0;
}
