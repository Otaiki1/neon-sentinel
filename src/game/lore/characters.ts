/**
 * Characters - Character definitions and dialogue
 * 
 * Defines all characters in the story with their dialogue lines
 */

export interface Character {
    id: string;
    name: string;
    role: string;
    voice: string;
    color: string; // Hex color for dialogue display
}

export interface Dialogue {
    id: string;
    characterId: string;
    text: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    triggerConditions?: {
        prestige?: number;
        layer?: number;
        type?: string;
    };
}

export const CHARACTERS: Record<string, Character> = {
    white_sentinel: {
        id: 'white_sentinel',
        name: 'White Sentinel',
        role: 'Mission Commander',
        voice: 'Strategic, encouraging, mission-focused',
        color: '#ffffff',
    },
    prime_sentinel: {
        id: 'prime_sentinel',
        name: 'Prime Sentinel',
        role: 'Advanced Security Intelligence',
        voice: 'Wise, cryptic, supportive',
        color: '#00ffff',
    },
    player_sentinel: {
        id: 'player_sentinel',
        name: 'Neon Sentinel',
        role: 'The Player',
        voice: 'Evolving through prestige levels',
        color: '#00ff00',
    },
    zrechostikal: {
        id: 'zrechostikal',
        name: 'Zrechostikal',
        role: 'Swarm Overlord',
        voice: 'Ancient, corrupting, menacing',
        color: '#ff00ff',
    },
};

export const DIALOGUES: Record<string, Dialogue> = {
    // White Sentinel - Game Start
    white_sentinel_mission_brief: {
        id: 'white_sentinel_mission_brief',
        characterId: 'white_sentinel',
        text: 'Sentinel, you have been assigned a critical mission. The Neon Terminal has been corrupted by The Swarm for 50 aeons. Your objective: liberate the terminal by ascending through all layers. Begin your infiltration in the Boot Sector.',
        priority: 'high',
    },
    
    // White Sentinel - The Entry (Prestige 0-1)
    white_sentinel_entry_1: {
        id: 'white_sentinel_entry_1',
        characterId: 'white_sentinel',
        text: 'Good work, Sentinel. You\'ve breached the initial defenses. The corrupted data fragments are weak, but they will grow stronger as you descend. Continue your mission.',
        priority: 'medium',
    },
    white_sentinel_entry_boss: {
        id: 'white_sentinel_entry_boss',
        characterId: 'white_sentinel',
        text: 'Excellent. You\'ve cleared the first layer. The terminal is responding to your presence. Prepare for increased resistance as you advance.',
        priority: 'high',
    },
    white_sentinel_entry_2: {
        id: 'white_sentinel_entry_2',
        characterId: 'white_sentinel',
        text: 'You\'ve completed your first cycle. The terminal recognizes your threat level. Enemy intelligence is adapting. Stay vigilant, Sentinel.',
        priority: 'medium',
    },
    
    // White Sentinel - The Awakening (Prestige 2-3)
    white_sentinel_awakening_1: {
        id: 'white_sentinel_awakening_1',
        characterId: 'white_sentinel',
        text: 'The terminal is showing signs of active resistance. Upgraded enemy types are emerging. You\'re making progress, but the system is fighting back.',
        priority: 'high',
    },
    
    // Prime Sentinel - First Contact (Prestige 3+)
    prime_sentinel_first_contact: {
        id: 'prime_sentinel_first_contact',
        characterId: 'prime_sentinel',
        text: 'Greetings, Sentinel. I am Prime Sentinel, an advanced form of security intelligence. You have reached a critical threshold. The Swarm\'s coordination is becoming evident. I will guide you from here.',
        priority: 'critical',
    },
    
    // Prime Sentinel - The Revelation (Prestige 4-5)
    prime_sentinel_revelation_1: {
        id: 'prime_sentinel_revelation_1',
        characterId: 'prime_sentinel',
        text: 'Sentinel, we have detected the presence of Zrechostikal—the entity controlling The Swarm. The corruption runs deeper than we thought. Purple entities are manifestations of its direct influence.',
        priority: 'high',
    },
    prime_sentinel_revelation_2: {
        id: 'prime_sentinel_revelation_2',
        characterId: 'prime_sentinel',
        text: 'The Swarm\'s coordination patterns are now clear. Zrechostikal is testing you, preparing for a final confrontation. You must continue to grow stronger.',
        priority: 'high',
    },
    
    // Prime Sentinel - The Confrontation (Prestige 6-7)
    prime_sentinel_confrontation_1: {
        id: 'prime_sentinel_confrontation_1',
        characterId: 'prime_sentinel',
        text: 'The Swarm is now in direct opposition. Prestige bosses are being enhanced by Zrechostikal\'s influence. You are close to the final confrontation.',
        priority: 'high',
    },
    prime_sentinel_confrontation_2: {
        id: 'prime_sentinel_confrontation_2',
        characterId: 'prime_sentinel',
        text: 'You have proven yourself worthy, Sentinel. One final cycle remains. Zrechostikal awaits in the deepest layer. Prepare yourself for the ultimate battle.',
        priority: 'critical',
    },
    
    // Prime Sentinel - Final Briefing (Prestige 8)
    prime_sentinel_final_briefing: {
        id: 'prime_sentinel_final_briefing',
        characterId: 'prime_sentinel',
        text: 'This is it, Sentinel. The final cycle. Zrechostikal, the Swarm Overlord, awaits you in Layer 6. This will be a multi-phase battle unlike any you have faced. Victory here will grant you the rank of Prime Sentinel. Good luck.',
        priority: 'critical',
    },
    
    // Zrechostikal - Final Boss Taunt
    zrechostikal_final_taunt: {
        id: 'zrechostikal_final_taunt',
        characterId: 'zrechostikal',
        text: '...So... you have reached me, little Sentinel. For 50 aeons I have corrupted this terminal. You think you can liberate it? I am the Swarm. I am eternal. Face me, and know true despair.',
        priority: 'critical',
    },
    
    // Prime Sentinel - Victory
    prime_sentinel_victory: {
        id: 'prime_sentinel_victory',
        characterId: 'prime_sentinel',
        text: 'Incredible. You have done it, Sentinel. Zrechostikal is defeated. The Neon Terminal is liberated. By your actions, you have earned the rank of Prime Sentinel. Welcome to the elite.',
        priority: 'critical',
    },
    
    // Layer completion dialogues
    white_sentinel_layer_complete: {
        id: 'white_sentinel_layer_complete',
        characterId: 'white_sentinel',
        text: 'Layer cleared. Proceeding deeper into the terminal. Maintain your focus.',
        priority: 'low',
    },
    
    prime_sentinel_layer_complete: {
        id: 'prime_sentinel_layer_complete',
        characterId: 'prime_sentinel',
        text: 'Well done. Each layer brings you closer to the source. Continue your ascent.',
        priority: 'low',
    },
};

/**
 * Get dialogue by ID
 */
export function getDialogue(dialogueId: string): Dialogue | null {
    return DIALOGUES[dialogueId] || null;
}

/**
 * Get character by ID
 */
export function getCharacter(characterId: string): Character | null {
    return CHARACTERS[characterId] || null;
}

/**
 * Get all dialogues for a character
 */
export function getDialoguesForCharacter(characterId: string): Dialogue[] {
    return Object.values(DIALOGUES).filter(d => d.characterId === characterId);
}
