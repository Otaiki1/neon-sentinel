/**
 * Story Arcs - Narrative progression data
 * 
 * Defines the story structure and progression through prestige levels
 */

export interface StoryArc {
    id: string;
    name: string;
    prestigeRange: [number, number];
    description: string;
    keyEvents: string[];
    avatarUnlock: string | null;
}

export const STORY_ARCS: Record<string, StoryArc> = {
    the_entry: {
        id: 'the_entry',
        name: 'The Entry',
        prestigeRange: [0, 1],
        description: 'White Sentinel assigns you the mission. Initial infiltration into terminal defenses. First encounters with corrupted data fragments.',
        keyEvents: [
            'White Sentinel mission briefing',
            'Initial infiltration begins',
            'First green enemy encounters',
            'Boot Sector cleared',
            'First prestige boss defeated',
        ],
        avatarUnlock: 'Default Sentinel (Azure Core)',
    },
    the_awakening: {
        id: 'the_awakening',
        name: 'The Awakening',
        prestigeRange: [2, 3],
        description: 'Terminal shows signs of resistance. Upgraded enemy types appear. Higher-level intelligence detected.',
        keyEvents: [
            'Yellow and blue enemies emerge',
            'Terminal resistance detected',
            'Prime Sentinel makes first contact',
            'Intermediate Sentinel avatar unlocked',
        ],
        avatarUnlock: 'Intermediate Sentinel',
    },
    the_revelation: {
        id: 'the_revelation',
        name: 'The Revelation',
        prestigeRange: [4, 5],
        description: 'Discovery of Zrechostikal\'s presence. Swarm coordination becomes evident. Purple entities emerge.',
        keyEvents: [
            'Zrechostikal presence detected',
            'Swarm coordination patterns identified',
            'Purple enemies appear',
            'Advanced Sentinel avatar unlocked',
        ],
        avatarUnlock: 'Advanced Sentinel',
    },
    the_confrontation: {
        id: 'the_confrontation',
        name: 'The Confrontation',
        prestigeRange: [6, 7],
        description: 'Direct opposition from the Swarm. Prestige bosses show increased power. Prime Sentinel guidance intensifies.',
        keyEvents: [
            'Swarm direct opposition begins',
            'Enhanced prestige bosses',
            'Prime Sentinel guidance',
            'Elite Sentinel avatar unlocked',
        ],
        avatarUnlock: 'Elite Sentinel',
    },
    prime_sentinel: {
        id: 'prime_sentinel',
        name: 'Prime Sentinel',
        prestigeRange: [8, 8],
        description: 'Final confrontation with Zrechostikal (Swarm Overlord). Multi-phase final boss battle. Upon victory: Promotion to Prime Sentinel rank.',
        keyEvents: [
            'Final boss briefing',
            'Zrechostikal confrontation',
            'Multi-phase battle',
            'Prime Sentinel promotion',
            'Prime Sentinel avatar unlocked',
        ],
        avatarUnlock: 'Prime Sentinel (legendary)',
    },
};

/**
 * Get story arc for a given prestige level
 */
export function getStoryArcForPrestige(prestige: number): StoryArc | null {
    for (const arc of Object.values(STORY_ARCS)) {
        const [min, max] = arc.prestigeRange;
        if (prestige >= min && prestige <= max) {
            return arc;
        }
    }
    return null;
}

/**
 * Get next story arc
 */
export function getNextStoryArc(currentPrestige: number): StoryArc | null {
    const currentArc = getStoryArcForPrestige(currentPrestige);
    if (!currentArc) return null;
    
    const arcOrder = [
        'the_entry',
        'the_awakening',
        'the_revelation',
        'the_confrontation',
        'prime_sentinel',
    ];
    
    const currentIndex = arcOrder.indexOf(currentArc.id);
    if (currentIndex === -1 || currentIndex === arcOrder.length - 1) {
        return null;
    }
    
    return STORY_ARCS[arcOrder[currentIndex + 1]] || null;
}
