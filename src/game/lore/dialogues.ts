/**
 * Dialogues - Dialogue data structure for trigger-based dialogue system
 * 
 * Defines all dialogues with their triggers, conditions, and metadata
 */

export interface Dialogue {
    id: string;
    speaker: string;
    text: string;
    trigger: string;
    prestige?: number;
    layer?: number;
    condition?: (state: DialogueState) => boolean;
}

export interface DialogueState {
    prestige: number;
    layer: number;
    isFirstRun: boolean;
    bossDefeated: boolean;
    prestigeCompleted: boolean;
    finalBossEncountered: boolean;
    finalBossDefeated: boolean;
}

/**
 * Dialogue database
 */
export const DIALOGUES: Dialogue[] = [
    // Trigger 1: Game Start
    {
        id: 'game_start',
        speaker: 'White Sentinel',
        text: 'Sentinel, you have been assigned to liberate Neon Terminal. The Swarm has corrupted this system for 50 aeons. Proceed with caution.',
        trigger: 'game_start',
        condition: (state) => state.isFirstRun,
    },
    
    // Trigger 2: Layer Start (First time in prestige)
    {
        id: 'prestige0_layer1',
        speaker: 'White Sentinel',
        text: 'You have entered the Boot Sector. Basic corrupted fragments detected. Begin your infiltration.',
        trigger: 'layer_start',
        prestige: 0,
        layer: 1,
    },
    {
        id: 'prestige1_layer1',
        speaker: 'White Sentinel',
        text: 'You advance deeper. The terminal awakens to your presence.',
        trigger: 'layer_start',
        prestige: 1,
        layer: 1,
    },
    {
        id: 'prestige2_layer1',
        speaker: 'White Sentinel',
        text: 'You have discovered something... The Swarm\'s presence deepens. New entities emerge.',
        trigger: 'layer_start',
        prestige: 2,
        layer: 1,
    },
    {
        id: 'prestige3_layer1',
        speaker: 'White Sentinel',
        text: 'The system recognizes your threat level. Enhanced security protocols activated.',
        trigger: 'layer_start',
        prestige: 3,
        layer: 1,
    },
    {
        id: 'prestige4_layer1',
        speaker: 'Prime Sentinel',
        text: 'Sentinel, we have detected Zrechostikal\'s direct influence. Purple entities are manifestations of its will.',
        trigger: 'layer_start',
        prestige: 4,
        layer: 1,
    },
    {
        id: 'prestige5_layer1',
        speaker: 'Prime Sentinel',
        text: 'The Swarm\'s coordination patterns are now clear. Zrechostikal is testing you.',
        trigger: 'layer_start',
        prestige: 5,
        layer: 1,
    },
    {
        id: 'prestige6_layer1',
        speaker: 'Prime Sentinel',
        text: 'The Swarm is in direct opposition. Prestige bosses are being enhanced by Zrechostikal\'s influence.',
        trigger: 'layer_start',
        prestige: 6,
        layer: 1,
    },
    {
        id: 'prestige7_layer1',
        speaker: 'Prime Sentinel',
        text: 'You have proven yourself worthy, Sentinel. One final cycle remains. Prepare yourself.',
        trigger: 'layer_start',
        prestige: 7,
        layer: 1,
    },
    {
        id: 'prestige8_layer1',
        speaker: 'Prime Sentinel',
        text: 'This is the final cycle. Zrechostikal awaits in the deepest layer. Victory here will grant you the rank of Prime Sentinel.',
        trigger: 'layer_start',
        prestige: 8,
        layer: 1,
    },
    
    // Trigger 3: Boss Encounter
    {
        id: 'boss_encounter_layer1',
        speaker: '[Boss Name]',
        text: 'I am the Guardian of the Boot Sector. You shall not pass.',
        trigger: 'boss_encounter',
        layer: 1,
    },
    {
        id: 'boss_encounter_layer2',
        speaker: '[Boss Name]',
        text: 'I am the Sentinel of Layer 2. Your intrusion ends here!',
        trigger: 'boss_encounter',
        layer: 2,
    },
    {
        id: 'boss_encounter_layer3',
        speaker: '[Boss Name]',
        text: 'I am the Hijack-Core of Layer 3. You face enhanced security protocols.',
        trigger: 'boss_encounter',
        layer: 3,
    },
    {
        id: 'boss_encounter_layer4',
        speaker: '[Boss Name]',
        text: 'I am the Core-Emperor of Layer 4. Zrechostikal\'s will flows through me.',
        trigger: 'boss_encounter',
        layer: 4,
    },
    {
        id: 'boss_encounter_layer5',
        speaker: '[Boss Name]',
        text: 'I am the System Protector. The terminal itself resists your intrusion.',
        trigger: 'boss_encounter',
        layer: 5,
    },
    {
        id: 'boss_encounter_layer6',
        speaker: '[Boss Name]',
        text: 'I am the Prestige Guardian. Defeat me to advance to the next cycle.',
        trigger: 'boss_encounter',
        layer: 6,
        condition: (state) => state.prestige < 8,
    },
    
    // Trigger 4: Boss Defeat
    {
        id: 'boss_defeat_white',
        speaker: 'White Sentinel',
        text: 'Excellent work, Sentinel. The path forward is clear.',
        trigger: 'boss_defeat',
        condition: (state) => state.prestige < 3,
    },
    {
        id: 'boss_defeat_prime',
        speaker: 'Prime Sentinel',
        text: 'Well done, Sentinel. Each victory brings you closer to the source.',
        trigger: 'boss_defeat',
        condition: (state) => state.prestige >= 3,
    },
    
    // Trigger 5: Prestige Completion
    {
        id: 'prestige_complete_0',
        speaker: 'White Sentinel',
        text: 'You have completed your first cycle. The terminal recognizes your threat level. Evolution awaits.',
        trigger: 'prestige_complete',
        prestige: 0,
    },
    {
        id: 'prestige_complete_1',
        speaker: 'White Sentinel',
        text: 'You have reached a new level of understanding. The Swarm adapts, but so do you.',
        trigger: 'prestige_complete',
        prestige: 1,
    },
    {
        id: 'prestige_complete_2',
        speaker: 'White Sentinel',
        text: 'The terminal is showing signs of active resistance. You\'re making progress, but the system fights back.',
        trigger: 'prestige_complete',
        prestige: 2,
    },
    {
        id: 'prestige_complete_3',
        speaker: 'Prime Sentinel',
        text: 'Greetings, Sentinel. I am Prime Sentinel. You have reached a critical threshold. I will guide you from here.',
        trigger: 'prestige_complete',
        prestige: 3,
    },
    {
        id: 'prestige_complete_4',
        speaker: 'Prime Sentinel',
        text: 'The Swarm\'s coordination is becoming evident. Zrechostikal\'s influence grows stronger.',
        trigger: 'prestige_complete',
        prestige: 4,
    },
    {
        id: 'prestige_complete_5',
        speaker: 'Prime Sentinel',
        text: 'You must continue to grow stronger. The final confrontation approaches.',
        trigger: 'prestige_complete',
        prestige: 5,
    },
    {
        id: 'prestige_complete_6',
        speaker: 'Prime Sentinel',
        text: 'You are close to the final confrontation. Zrechostikal awaits.',
        trigger: 'prestige_complete',
        prestige: 6,
    },
    {
        id: 'prestige_complete_7',
        speaker: 'Prime Sentinel',
        text: 'One final cycle remains. Zrechostikal awaits in the deepest layer. Prepare yourself for the ultimate battle.',
        trigger: 'prestige_complete',
        prestige: 7,
    },
    
    // Trigger 6: Final Boss Encounter (Prestige 8, Layer 6)
    {
        id: 'final_boss_encounter',
        speaker: 'Prime Sentinel',
        text: 'This is it, Sentinel. Before you stands Zrechostikal itself. Defeat this entity, and you shall become Prime Sentinel. For the Grid.',
        trigger: 'final_boss_encounter',
        prestige: 8,
        layer: 6,
    },
    
    // Trigger 7: Final Boss Defeat
    {
        id: 'final_boss_defeat',
        speaker: 'Prime Sentinel',
        text: 'You have done it. Terminal Neon is liberated. Rise, Prime Sentinel.',
        trigger: 'final_boss_defeat',
        prestige: 8,
        layer: 6,
    },
];

/**
 * Get dialogue by ID
 */
export function getDialogueById(id: string): Dialogue | null {
    return DIALOGUES.find(d => d.id === id) || null;
}

/**
 * Get dialogues by trigger
 */
export function getDialoguesByTrigger(trigger: string): Dialogue[] {
    return DIALOGUES.filter(d => d.trigger === trigger);
}

/**
 * Get dialogue for trigger with state matching
 */
export function getDialogueForTrigger(
    trigger: string,
    state: DialogueState
): Dialogue | null {
    const candidates = getDialoguesByTrigger(trigger);
    
    // Filter by prestige and layer if specified
    let matches = candidates.filter(d => {
        if (d.prestige !== undefined && d.prestige !== state.prestige) {
            return false;
        }
        if (d.layer !== undefined && d.layer !== state.layer) {
            return false;
        }
        if (d.condition && !d.condition(state)) {
            return false;
        }
        return true;
    });
    
    // If multiple matches, prefer exact prestige/layer match
    if (matches.length > 1) {
        const exactMatch = matches.find(
            d => d.prestige === state.prestige && d.layer === state.layer
        );
        if (exactMatch) {
            return exactMatch;
        }
    }
    
    // Return first match or null
    return matches[0] || null;
}

/**
 * Get all dialogues
 */
export function getAllDialogues(): Dialogue[] {
    return DIALOGUES;
}
