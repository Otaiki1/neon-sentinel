/**
 * Story Service - Tracks story milestones and progression
 * 
 * Manages story state, milestone completion, and dialogue triggers
 * based on prestige level and layer progression.
 */

export interface StoryMilestone {
    id: string;
    prestige: number;
    layer: number;
    type: 'game_start' | 'layer_complete' | 'prestige_milestone' | 'boss_defeat' | 'final_boss';
    character: 'white_sentinel' | 'prime_sentinel' | 'zrechostikal';
    dialogueId: string;
    completed: boolean;
}

export interface StoryState {
    currentPrestige: number;
    currentLayer: number;
    completedMilestones: Set<string>;
    lastTriggeredMilestone: string | null;
    storyArc: string | null;
}

const STORY_MILESTONE_KEY = 'neon-sentinel-story-milestones';
const STORY_STATE_KEY = 'neon-sentinel-story-state';

/**
 * Get all story milestones
 */
export function getStoryMilestones(): StoryMilestone[] {
    const stored = localStorage.getItem(STORY_MILESTONE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            return parsed.map((m: any) => ({
                ...m,
                completed: m.completed || false,
            }));
        } catch {
            // Invalid data, return defaults
        }
    }
    return getDefaultMilestones();
}

/**
 * Get default story milestones based on the narrative arc
 */
function getDefaultMilestones(): StoryMilestone[] {
    return [
        // Game Start - Prestige 0
        {
            id: 'game_start_0',
            prestige: 0,
            layer: 1,
            type: 'game_start',
            character: 'white_sentinel',
            dialogueId: 'white_sentinel_mission_brief',
            completed: false,
        },
        
        // Prestige 0-1: "The Entry"
        {
            id: 'prestige_0_layer_1',
            prestige: 0,
            layer: 1,
            type: 'layer_complete',
            character: 'white_sentinel',
            dialogueId: 'white_sentinel_entry_1',
            completed: false,
        },
        {
            id: 'prestige_0_layer_6',
            prestige: 0,
            layer: 6,
            type: 'boss_defeat',
            character: 'white_sentinel',
            dialogueId: 'white_sentinel_entry_boss',
            completed: false,
        },
        {
            id: 'prestige_1_start',
            prestige: 1,
            layer: 1,
            type: 'prestige_milestone',
            character: 'white_sentinel',
            dialogueId: 'white_sentinel_entry_2',
            completed: false,
        },
        
        // Prestige 2-3: "The Awakening"
        {
            id: 'prestige_2_start',
            prestige: 2,
            layer: 1,
            type: 'prestige_milestone',
            character: 'white_sentinel',
            dialogueId: 'white_sentinel_awakening_1',
            completed: false,
        },
        {
            id: 'prestige_3_start',
            prestige: 3,
            layer: 1,
            type: 'prestige_milestone',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_first_contact',
            completed: false,
        },
        
        // Prestige 4-5: "The Revelation"
        {
            id: 'prestige_4_start',
            prestige: 4,
            layer: 1,
            type: 'prestige_milestone',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_revelation_1',
            completed: false,
        },
        {
            id: 'prestige_5_start',
            prestige: 5,
            layer: 1,
            type: 'prestige_milestone',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_revelation_2',
            completed: false,
        },
        
        // Prestige 6-7: "The Confrontation"
        {
            id: 'prestige_6_start',
            prestige: 6,
            layer: 1,
            type: 'prestige_milestone',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_confrontation_1',
            completed: false,
        },
        {
            id: 'prestige_7_start',
            prestige: 7,
            layer: 1,
            type: 'prestige_milestone',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_confrontation_2',
            completed: false,
        },
        
        // Prestige 8: "Prime Sentinel" - Final Boss
        {
            id: 'prestige_8_start',
            prestige: 8,
            layer: 1,
            type: 'prestige_milestone',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_final_briefing',
            completed: false,
        },
        {
            id: 'prestige_8_layer_6',
            prestige: 8,
            layer: 6,
            type: 'final_boss',
            character: 'zrechostikal',
            dialogueId: 'zrechostikal_final_taunt',
            completed: false,
        },
        {
            id: 'final_boss_defeat',
            prestige: 8,
            layer: 6,
            type: 'final_boss',
            character: 'prime_sentinel',
            dialogueId: 'prime_sentinel_victory',
            completed: false,
        },
    ];
}

/**
 * Save story milestones to localStorage
 */
export function saveStoryMilestones(milestones: StoryMilestone[]): void {
    try {
        localStorage.setItem(STORY_MILESTONE_KEY, JSON.stringify(milestones));
    } catch (error) {
        console.error('Failed to save story milestones:', error);
    }
}

/**
 * Mark a milestone as completed
 */
export function completeMilestone(milestoneId: string): void {
    const milestones = getStoryMilestones();
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
        milestone.completed = true;
        saveStoryMilestones(milestones);
    }
}

/**
 * Check if a milestone is completed
 */
export function isMilestoneCompleted(milestoneId: string): boolean {
    const milestones = getStoryMilestones();
    const milestone = milestones.find(m => m.id === milestoneId);
    return milestone?.completed || false;
}

/**
 * Get current story state
 */
export function getStoryState(): StoryState {
    const stored = localStorage.getItem(STORY_STATE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            return {
                ...parsed,
                completedMilestones: new Set(parsed.completedMilestones || []),
            };
        } catch {
            // Invalid data, return defaults
        }
    }
    return {
        currentPrestige: 0,
        currentLayer: 1,
        completedMilestones: new Set<string>(),
        lastTriggeredMilestone: null,
        storyArc: null,
    };
}

/**
 * Save story state
 */
export function saveStoryState(state: StoryState): void {
    try {
        const toSave = {
            ...state,
            completedMilestones: Array.from(state.completedMilestones),
        };
        localStorage.setItem(STORY_STATE_KEY, JSON.stringify(toSave));
    } catch (error) {
        console.error('Failed to save story state:', error);
    }
}

/**
 * Update story state with current prestige and layer
 */
export function updateStoryState(prestige: number, layer: number): void {
    const state = getStoryState();
    state.currentPrestige = prestige;
    state.currentLayer = layer;
    
    // Determine story arc
    if (prestige <= 1) {
        state.storyArc = 'the_entry';
    } else if (prestige <= 3) {
        state.storyArc = 'the_awakening';
    } else if (prestige <= 5) {
        state.storyArc = 'the_revelation';
    } else if (prestige <= 7) {
        state.storyArc = 'the_confrontation';
    } else {
        state.storyArc = 'prime_sentinel';
    }
    
    saveStoryState(state);
}

/**
 * Get milestone for current prestige/layer combination
 */
export function getMilestoneForProgress(
    prestige: number,
    layer: number,
    type?: StoryMilestone['type']
): StoryMilestone | null {
    const milestones = getStoryMilestones();
    
    // Filter by type if provided
    const filtered = type 
        ? milestones.filter(m => m.type === type)
        : milestones;
    
    // Find exact match first
    let milestone = filtered.find(
        m => m.prestige === prestige && m.layer === layer
    );
    
    // If no exact match, find by prestige start (layer 1)
    if (!milestone && layer === 1) {
        milestone = filtered.find(
            m => m.prestige === prestige && m.type === 'prestige_milestone'
        );
    }
    
    // If still no match, find game start for prestige 0
    if (!milestone && prestige === 0 && layer === 1) {
        milestone = filtered.find(m => m.type === 'game_start');
    }
    
    return milestone || null;
}

/**
 * Check if a milestone should be triggered
 */
export function shouldTriggerMilestone(
    prestige: number,
    layer: number,
    type: StoryMilestone['type']
): boolean {
    const milestone = getMilestoneForProgress(prestige, layer, type);
    if (!milestone) {
        return false;
    }
    
    // Don't trigger if already completed
    if (milestone.completed) {
        return false;
    }
    
    return true;
}

/**
 * Get story arc name for prestige level
 */
export function getStoryArcName(prestige: number): string {
    if (prestige <= 1) return 'The Entry';
    if (prestige <= 3) return 'The Awakening';
    if (prestige <= 5) return 'The Revelation';
    if (prestige <= 7) return 'The Confrontation';
    return 'Prime Sentinel';
}
