/**
 * Pregame Upgrade Service
 *
 * Session-only upgrades bought before a run. Effects apply for one game and are consumed.
 */

export type PregameUpgradeId =
    | "extra_health_1"
    | "extra_health_2"
    | "max_health_6"
    | "gun_power"
    | "fire_rate"
    | "powerup_duration"
    | "movement_speed";

export interface PregameUpgradeDef {
    id: PregameUpgradeId;
    name: string;
    description: string;
    cost: number;
    /** Effects applied in GameScene for this session only */
    effects: {
        extraHealthBars?: number;
        maxHealthBars?: number;
        bulletDamageMultiplier?: number;
        fireRateMultiplier?: number;
        powerupDurationMultiplier?: number;
        speedMultiplier?: number;
    };
}

const PREGAME_UPGRADES: PregameUpgradeDef[] = [
    {
        id: "extra_health_1",
        name: "Extra Heart",
        description: "+1 health bar this run",
        cost: 25,
        effects: { extraHealthBars: 1 },
    },
    {
        id: "extra_health_2",
        name: "Double Heart",
        description: "+2 health bars this run",
        cost: 50,
        effects: { extraHealthBars: 2 },
    },
    {
        id: "max_health_6",
        name: "Reinforced Core",
        description: "Max 6 health bars this run",
        cost: 40,
        effects: { maxHealthBars: 6 },
    },
    {
        id: "gun_power",
        name: "Overcharged Gun",
        description: "Bullet damage +20% this run",
        cost: 45,
        effects: { bulletDamageMultiplier: 1.2 },
    },
    {
        id: "fire_rate",
        name: "Rapid Fire",
        description: "Fire rate +15% this run",
        cost: 40,
        effects: { fireRateMultiplier: 1.15 },
    },
    {
        id: "powerup_duration",
        name: "Extended Boost",
        description: "Power-up duration +25% this run",
        cost: 35,
        effects: { powerupDurationMultiplier: 1.25 },
    },
    {
        id: "movement_speed",
        name: "Agility Pack",
        description: "Movement speed +10% this run",
        cost: 30,
        effects: { speedMultiplier: 1.1 },
    },
];

export function getAllPregameUpgrades(): PregameUpgradeDef[] {
    return [...PREGAME_UPGRADES];
}

export function getPregameUpgrade(id: PregameUpgradeId): PregameUpgradeDef | undefined {
    return PREGAME_UPGRADES.find((u) => u.id === id);
}

export function getPregameUpgradeCost(id: PregameUpgradeId): number {
    return getPregameUpgrade(id)?.cost ?? 0;
}

/**
 * Merge multiple upgrade effects into one session effect object for the game.
 */
export interface PregameSessionEffects {
    extraHealthBars: number;
    maxHealthBars: number | null;
    bulletDamageMultiplier: number;
    fireRateMultiplier: number;
    powerupDurationMultiplier: number;
    speedMultiplier: number;
}

export function mergePregameEffects(upgradeIds: PregameUpgradeId[]): PregameSessionEffects {
    const out: PregameSessionEffects = {
        extraHealthBars: 0,
        maxHealthBars: null,
        bulletDamageMultiplier: 1,
        fireRateMultiplier: 1,
        powerupDurationMultiplier: 1,
        speedMultiplier: 1,
    };
    for (const id of upgradeIds) {
        const def = getPregameUpgrade(id);
        if (!def) continue;
        const e = def.effects;
        if (e.extraHealthBars != null) out.extraHealthBars += e.extraHealthBars;
        if (e.maxHealthBars != null) out.maxHealthBars = e.maxHealthBars;
        if (e.bulletDamageMultiplier != null)
            out.bulletDamageMultiplier *= e.bulletDamageMultiplier;
        if (e.fireRateMultiplier != null) out.fireRateMultiplier *= e.fireRateMultiplier;
        if (e.powerupDurationMultiplier != null)
            out.powerupDurationMultiplier *= e.powerupDurationMultiplier;
        if (e.speedMultiplier != null) out.speedMultiplier *= e.speedMultiplier;
    }
    return out;
}

export function getTotalPregameCost(upgradeIds: PregameUpgradeId[]): number {
    return upgradeIds.reduce((sum, id) => sum + getPregameUpgradeCost(id), 0);
}
