/**
 * Final Boss Service - Manages Zrechostikal final boss encounter
 * 
 * Handles final boss phases, health, attacks, and victory conditions
 */

export interface FinalBossPhase {
    phase: number;
    name: string;
    healthThreshold: number; // Health percentage when phase starts (100 = 100%)
    healthEnd: number; // Health percentage when phase ends
    assaultDuration: number; // Assault phase duration in ms
    restDuration: number; // Rest phase duration in ms
    attacks: string[];
    dialogue?: string;
    spawnEnemies: boolean;
    enemySpawnRate?: number;
}

export const FINAL_BOSS_PHASES: FinalBossPhase[] = [
    {
        phase: 1,
        name: 'Manifestation',
        healthThreshold: 100,
        healthEnd: 75,
        assaultDuration: 20000, // 20 seconds
        restDuration: 5000, // 5 seconds
        attacks: ['projectile_spread'],
        dialogue: 'You dare challenge me? I am the Swarm.',
        spawnEnemies: false,
    },
    {
        phase: 2,
        name: 'Acceleration',
        healthThreshold: 75,
        healthEnd: 50,
        assaultDuration: 15000, // 15 seconds
        restDuration: 3000, // 3 seconds
        attacks: ['projectile_spread', 'homing_projectiles'],
        dialogue: 'Your defenses are crumbling.',
        spawnEnemies: true,
        enemySpawnRate: 0.3, // 30% chance per second
    },
    {
        phase: 3,
        name: 'Corruption',
        healthThreshold: 50,
        healthEnd: 25,
        assaultDuration: 18000, // 18 seconds
        restDuration: 2000, // 2 seconds
        attacks: ['projectile_spread', 'homing_projectiles', 'stun_shockwave'],
        dialogue: 'I have infected galaxies. You are nothing.',
        spawnEnemies: true,
        enemySpawnRate: 0.5, // 50% chance per second
    },
    {
        phase: 4,
        name: 'Desperation',
        healthThreshold: 25,
        healthEnd: 0,
        assaultDuration: 25000, // 25 seconds
        restDuration: 1000, // 1 second
        attacks: ['projectile_spread', 'homing_projectiles', 'stun_shockwave', 'enhanced_attacks'],
        dialogue: 'Impossible... I am eternal...',
        spawnEnemies: true,
        enemySpawnRate: 0.7, // 70% chance per second
    },
];

/**
 * Calculate final boss health based on prestige level
 */
export function getFinalBossHealth(prestige: number): number {
    const baseHealth = 1000;
    const scalingFactor = 2.0 + (0.5 * prestige);
    return Math.round(baseHealth * scalingFactor);
}

/**
 * Get final boss health at Prestige 8
 */
export function getFinalBossHealthP8(): number {
    return getFinalBossHealth(8); // 1000 * 5.0 = 5000
}

/**
 * Get current phase based on health percentage
 */
export function getCurrentPhase(currentHealth: number, maxHealth: number): FinalBossPhase | null {
    const healthPercent = (currentHealth / maxHealth) * 100;
    
    for (const phase of FINAL_BOSS_PHASES) {
        if (healthPercent <= phase.healthThreshold && healthPercent > phase.healthEnd) {
            return phase;
        }
    }
    
    // If health is at or below 0, return phase 4 (final phase)
    if (healthPercent <= 0) {
        return FINAL_BOSS_PHASES[3];
    }
    
    // Default to phase 1 if health is above threshold
    return FINAL_BOSS_PHASES[0];
}

/**
 * Check if final boss should spawn (Prestige 8, Layer 6)
 */
export function shouldSpawnFinalBoss(prestige: number, layer: number): boolean {
    return prestige === 8 && layer === 6;
}

/**
 * Get final boss dialogue for phase
 */
export function getFinalBossDialogue(phase: number): string {
    const phaseData = FINAL_BOSS_PHASES.find(p => p.phase === phase);
    return phaseData?.dialogue || '';
}

/**
 * Get final defeat dialogue
 */
export function getFinalDefeatDialogue(): string {
    return 'I... am... defeated...';
}

/**
 * Check if Prime Sentinel achievement should be unlocked
 */
export function shouldUnlockPrimeSentinel(prestige: number, layer: number, bossDefeated: boolean): boolean {
    return prestige === 8 && layer === 6 && bossDefeated;
}
