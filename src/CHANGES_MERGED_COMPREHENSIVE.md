# 🚀 Neon Sentinel - Complete Evolution Implementation Guide

> **Comprehensive Roadmap: Prestige-Based Progression, Avatar System, Story Integration, and Meta-Progression**

This document consolidates all evolution requirements for Neon Sentinel into a single, unified implementation guide. It provides actionable steps for transforming the game from an endless arcade shooter into a story-driven progression experience with avatars, rank systems, and deep meta-progression.

**Status**: Ready for Development
**Estimated Duration**: 4-5 weeks
**Last Updated**: January 27, 2026

---

## 📋 Table of Contents

1. [Core Story & Narrative Arc](#core-story--narrative-arc)
2. [Prestige-Based Avatar System](#prestige-based-avatar-system)
3. [Prestige Structure & Progression](#prestige-structure--progression)
4. [Rank & Bragging Rights System](#rank--bragging-rights-system)
5. [Coin Economy Overhaul](#coin-economy-overhaul)
6. [Health & Damage System](#health--damage-system)
7. [Power-Up Evolution & Mini-Me Companions](#power-up-evolution--mini-me-companions)
8. [Enemy Progression & Naming System](#enemy-progression--naming-system)
9. [Dialogue & Character Interaction](#dialogue--character-interaction)
10. [Bullet Upgrade System](#bullet-upgrade-system)
11. [Final Boss & Prime Sentinel Ending](#final-boss--prime-sentinel-ending)
12. [Configuration System Updates](#configuration-system-updates)
13. [Asset Integration & Mapping](#asset-integration--mapping)
14. [UI/UX Updates & Components](#uiux-updates--components)
15. [Testing, Validation & Balance](#testing-validation--balance)
16. [Implementation Phases & Timeline](#implementation-phases--timeline)

---

## 📖 Core Story & Narrative Arc

### Overarching Narrative

**Setting**: The player is a **Sentinel** - an autonomous security program assigned by the **White Sentinel** (mission commander) to liberate the corrupted **Neon Terminal**.

**Key Story Elements**:
- **Neon Terminal**: A massive system plagued by The Swarm for **50 aeons**
- **The Swarm**: A parasitic corruption spreading through all terminal layers
- **Player Goal**: Ascend from basic Sentinel → Prime Sentinel by defeating Zrechostikal
- **Journey Structure**: 6 prestige levels, each with 6 layers (36 total progression steps)

### Story Arc Progression

**Prestige 0-1: "The Entry"**
- White Sentinel assigns you the mission
- Initial infiltration into terminal defenses
- First encounters with corrupted data fragments (green enemies)
- Avatar Unlock: Default Sentinel (Azure Core)

**Prestige 2-3: "The Awakening"**
- Terminal shows signs of resistance
- Upgraded enemy types appear (yellow, blue)
- Higher-level intelligence detected
- Avatar Unlock: Intermediate Sentinel

**Prestige 4-5: "The Revelation"**
- Discovery of Zrechostikal's presence
- Swarm coordination becomes evident
- Purple entities emerge
- Avatar Unlock: Advanced Sentinel

**Prestige 6-7: "The Confrontation"**
- Direct opposition from the Swarm
- Prestige bosses show increased power
- Prime Sentinel makes first contact
- Avatar Unlock: Elite Sentinel

**Prestige 8: "Prime Sentinel"**
- Final confrontation with Zrechostikal (Swarm Overlord)
- Multi-phase final boss battle
- Upon victory: Promotion to Prime Sentinel rank
- Avatar Unlock: Prime Sentinel (legendary)

### Character Framework

**White Sentinel**
- Role: Mission commander and mentor
- Voice: Strategic, encouraging, mission-focused
- Appears: Game start, layer completions, prestige milestones
- Purpose: Provide narrative context and progression motivation

**Prime Sentinel**
- Role: Advanced form of security intelligence, appears at Prestige 3+
- Voice: Wise, cryptic, supportive
- Appears: Daily coin delivery, prestige 5+ interactions, final boss briefing
- Purpose: Guide player toward prime sentinel goal

**Player Sentinel**
- Role: The player's character, evolves through prestige levels
- Evolution: Basic Sentinel → Prime Sentinel (Rank: Neon Sentinel)
- Visual: Avatar changes based on selection and prestige

**Zrechostikal (Swarm Overlord)**
- Role: Final antagonist, entity controlling the swarm
- Voice: Ancient, corrupting, menacing
- Appearance: Prestige 8, Layer 6 final boss fight
- Dialogue: Taunts and multi-phase interactions

### Implementation Requirements

**Files to Create**:
- `src/services/storyService.ts` - Story milestone tracking
- `src/game/lore/storyArcs.ts` - Story sequence data
- `src/game/lore/characters.ts` - Character definitions
- `src/game/dialogue/DialogueManager.ts` - Dialogue system

**Files to Modify**:
- `src/game/scenes/GameScene.ts` - Add story triggers
- `src/game/scenes/UIScene.ts` - Display dialogue
- `PLAYER_BIBLE.md` - Add story section
- `DEVELOPER_BIBLE.md` - Add story architecture

---

## 🎭 Prestige-Based Avatar System

### Avatar Progression Philosophy

**Core Rule**: Players unlock new **Avatars** only by:
1. Reaching specific **Prestige levels**
2. Paying the required **coin cost** from inventory

Each avatar has:
- **Unique stat bonuses** (firepower, speed, health)
- **Cosmetic appearance** (sprite variant)
- **Prestige requirement** to unlock
- **Coin purchase cost** to own

### Avatar Tiers & Unlocks

**Tier 1: Entry Sentinels (Prestige 0-1)**
- **Default Sentinel (Azure Core)** - Prestige 0, 0 coins (always owned)
  - Balanced stats: 1.0x speed, 1.0x fire rate, 1.0x health
- **Swift Interceptor (Violet Prototype)** - Prestige 1, 500 coins
  - +20% speed, -10% fire rate, standard health
- **Artillery Unit (Crimson Prototype)** - Prestige 1, 500 coins
  - -15% speed, +25% fire rate, standard health

**Tier 2: Veteran Sentinels (Prestige 2-3)**
- **Guardian Core (Amber Veteran)** - Prestige 2, 1500 coins
  - +15% speed, +15% fire rate, +30% health
- **Sniper Kernel (Alabaster Veteran)** - Prestige 2, 1500 coins
  - Standard speed, -10% fire rate, piercing bullets
- **Assault Nexus (Orange Veteran)** - Prestige 3, 2000 coins
  - +25% speed, +20% fire rate, +20% health, burst fire

**Tier 3: Elite Sentinels (Prestige 4-5)**
- **Neon Guardian (Cyan Elite)** - Prestige 4, 3000 coins
  - +30% all stats, special aura effect
- **Void Sentinel (Black Elite)** - Prestige 4, 3500 coins
  - +40% speed, enhanced invisibility, shadow effect
- **Plasma Core (White Elite)** - Prestige 5, 4000 coins
  - +35% fire rate, +25% damage, energy effect

**Tier 4: Prime Sentinels (Prestige 6-8)**
- **Prime Sentinel (Gold Ascended)** - Prestige 6, 5000 coins
  - +50% all stats, maximum power
- **Transcendent Form (Platinum Ascended)** - Prestige 8, 7500 coins
  - Unlock after defeating Zrechostikal only
  - +60% all stats, legendary effects, special sprite

### Avatar Stat Application

**Stat Bonuses Applied In Order**:
1. Load base player config (PLAYER_CONFIG defaults)
2. Apply avatar stat multipliers
3. Apply hero grade bonuses (if applicable)
4. Apply active power-up multipliers
5. Store composite stats in registry

**Example**: Prestige 4 with Neon Guardian Avatar
- Base speed: 400 px/s → +30% → 520 px/s
- Base fireRate: 150ms → +30% faster → 105ms
- Base health: 5 bars → +30% effective → ~6.5 bars (capped at 5)

### Avatar Service Implementation

**File**: `src/services/avatarService.ts`

**Functions Required**:
- `getAvailableAvatars(prestigeLevel)` - Returns purchasable avatars for prestige
- `getPurchasedAvatars()` - Returns list of owned avatar IDs
- `purchaseAvatar(avatarId, coinCost)` - Deduct coins, unlock avatar
- `isAvatarUnlocked(avatarId)` - Check ownership status
- `setActiveAvatar(avatarId)` - Set current avatar
- `getActiveAvatar()` - Return current avatar config
- `getAvatarStats(avatarId)` - Return stat multipliers
- `applyAvatarStats(baseStats, avatarStats)` - Merge stats

**Data Persistence**:
- Key: `neonSentinel_purchasedAvatars` (array of avatar IDs)
- Key: `neonSentinel_activeAvatarId` (current selection)
- Load on game start, save after purchases

### Avatar Selection UI

**Landing Page Updates**:
1. Add avatar selector above "Start Game" button
2. Show current avatar sprite and name
3. Add "Change Avatar" button → opens modal
4. Display coin balance
5. Show prestige requirement badges

**Avatar Selection Modal**:
1. Grid layout of all avatars (6-8 per row)
2. Locked avatars show prestige requirement
3. Unlocked but unpurchased show coin cost
4. Owned avatars show "SELECT" button
5. Display avatar stats on hover/selection
6. Stat comparison vs. current avatar

---

## 🏆 Prestige Structure & Progression

### 6x6 Progression Model

Instead of infinite prestige loops, structure as definitive narrative:

**Structure**:
- 8 Prestige Levels (0-7 regular, 8 is final)
- Each Prestige has 6 Layers (L1-L6)
- **Total progression**: 48 layers (8 prestige × 6 layers)
- Layer 6 of each prestige contains the Prestige Boss
- Prestige 8, Layer 6 contains Zrechostikal (final boss)

### Prestige Progression Rules

**Prestige Advancement**:
- Complete all 6 layers of current prestige
- Defeat prestige boss at Layer 6
- Advance to next prestige
- Unlock new avatar tier
- Earn prestige completion coins: `2 * (2^prestigeLevel)`

**Example Progression**:
- Prestige 0 → 1: Defeat Green Boss (Layer 6), earn 2 coins
- Prestige 1 → 2: Defeat Yellow Boss (Layer 6), earn 4 coins
- Prestige 2 → 3: Defeat Blue Boss (Layer 6), earn 8 coins
- Prestige 7 → 8: Defeat Purple Boss (Layer 6), earn 256 coins
- Prestige 8 → Prime: Defeat Zrechostikal, become Prime Sentinel

### Prestige Difficulty Scaling

**Difficulty Multipliers Per Prestige**:
- Prestige 0: 1.0x enemy health, 1.0x difficulty
- Prestige 1: 1.5x enemy health, 1.5x difficulty
- Prestige 2: 2.0x enemy health, 2.0x difficulty
- Prestige 3: 2.5x enemy health, 2.5x difficulty
- Prestige 4: 3.0x enemy health, 3.0x difficulty
- Prestige 5: 3.5x enemy health, 3.5x difficulty
- Prestige 6: 4.0x enemy health, 4.0x difficulty
- Prestige 7: 4.5x enemy health, 4.5x difficulty
- Prestige 8: 5.0x enemy health, 5.0x difficulty (final challenge)

**Score Multiplier Per Prestige**:
- Prestige 0: 1.0x
- Prestige 1: 1.3x
- Prestige 2: 1.6x
- Prestige 3: 2.0x
- Prestige 4: 2.5x
- Prestige 5: 3.0x
- Prestige 6: 4.0x
- Prestige 7: 5.0x
- Prestige 8: 7.0x

### Configuration Updates

**PRESTIGE_CONFIG Changes**:
- Rename `prestigeLevels` to `prestigeTiers` (0-8)
- Add per-prestige:
  - `name` (e.g., "The Entry", "The Awakening")
  - `storyArc` (narrative reference)
  - `overlordId` (boss identifier)
  - `avatarUnlock` (avatar that unlocks)
  - `difficultyMultiplier`
  - `scoreMultiplier`

**Track in Registry**:
- `currentPrestige` (0-8)
- `currentLayer` (1-6)
- `previousPrestige` (for transitions)
- `prestigeCompleted` (boolean array, length 9)

---

## 🏅 Rank & Bragging Rights System

### Rank Progression Structure

**Rank System Philosophy**: Players earn visible ranks based on prestige + layer combination, providing bragging rights on leaderboards and profiles.

### Rank Tiers (18 Total)

Ranks are earned by reaching specific prestige/layer combinations:

**Entry Ranks (Prestige 0-1)**
- **Rank 1**: Prestige 0, Layer 1 - "Initiate Sentinel" 
- **Rank 2**: Prestige 0, Layer 3 - "Trial Sentinel"
- **Rank 3**: Prestige 0, Layer 6 - "Boot Master" (after prestige boss)
- **Rank 4**: Prestige 1, Layer 3 - "Advancing Sentinel"
- **Rank 5**: Prestige 1, Layer 6 - "Firewall Breaker"

**Intermediate Ranks (Prestige 2-3)**
- **Rank 6**: Prestige 2, Layer 3 - "Security Breaker"
- **Rank 7**: Prestige 2, Layer 6 - "Core Liberator"
- **Rank 8**: Prestige 3, Layer 3 - "Revelation Seeker"
- **Rank 9**: Prestige 3, Layer 6 - "AI Executor"

**Advanced Ranks (Prestige 4-5)**
- **Rank 10**: Prestige 4, Layer 3 - "Corruption Master"
- **Rank 11**: Prestige 4, Layer 6 - "Kernel Shatterer"
- **Rank 12**: Prestige 5, Layer 3 - "System Ascendant"
- **Rank 13**: Prestige 5, Layer 6 - "Breach Master"

**Elite Ranks (Prestige 6-7)**
- **Rank 14**: Prestige 6, Layer 3 - "Neon Defender"
- **Rank 15**: Prestige 6, Layer 6 - "Terminal Guardian"
- **Rank 16**: Prestige 7, Layer 3 - "Void Walker"
- **Rank 17**: Prestige 7, Layer 6 - "Sentinel Prime-Elect"

**Legendary Rank**
- **Rank 18**: Prestige 8, Layer 6 - "Prime Sentinel" (ultimate, only after defeating Zrechostikal)

### Rank Service Implementation

**File**: `src/services/rankService.ts`

**Functions Required**:
- `getCurrentRank(prestige, layer)` - Calculate current rank name/number
- `getRankNumber(prestige, layer)` - Get numeric rank (1-18)
- `getRankProgress(prestige, layer)` - Progress toward next rank
- `getRankHistory()` - Return array of achieved ranks
- `getRankBadge(rankNumber)` - Return badge sprite for rank
- `calculateRankMilestone(prestige, layer)` - Check if rank milestone achieved

**Rank Configuration**:
```
RANK_CONFIG = {
  ranks: [
    { number: 1, prestige: 0, layer: 1, name: "Initiate Sentinel", badge: "badge_1" },
    { number: 2, prestige: 0, layer: 3, name: "Trial Sentinel", badge: "badge_2" },
    // ... continues through rank 18
  ]
}
```

### Rank Display & Integration

**Where Ranks Appear**:
1. **Landing Page** - Current rank with badge
2. **Game HUD** - Below layer indicator
3. **Game Over Screen** - Rank progression
4. **Leaderboard** - Next to score
5. **Profile Page** - Full rank history timeline
6. **Pause Menu** - Current rank

**Rank Upgrade Notification**:
- On rank achievement: Show announcement card
- Display: "[Rank Name] - Rank [X] Achieved!"
- Offer rank badge selection if applicable
- Store in achievements system

---

## 💰 Coin Economy Overhaul

### Coin Earning Sources

**Source 1: Prestige Completion**
- Earned when prestige level completes
- Formula: `2 * (2^prestigeLevel)`
- Example:
  - P0→1: 2 coins
  - P1→2: 4 coins
  - P2→3: 8 coins
  - P3→4: 16 coins
  - P4→5: 32 coins
  - P5→6: 64 coins
  - P6→7: 128 coins
  - P7→8: 256 coins

**Source 2: Daily Prime Sentinel Bonus**
- Unlocked after reaching Prestige 3 (Prime Sentinel contact)
- **3 coins per day** at midnight
- Reset system: Identical to current daily coins
- Notification: "Prime Sentinel has sent you 3 coins!"

**Source 3: Gameplay Pickups** (Optional)
- Rare coin pickups during combat (could be added later)
- Currently: Not in base implementation

### Coin Spending Sinks

**Sink 1: Avatar Purchases**
- Tier 1 avatars: 500-1000 coins
- Tier 2 avatars: 1500-2500 coins
- Tier 3 avatars: 3000-5000 coins
- Tier 4 avatars: 5000-7500 coins
- Total unlockable: ~20,000 coins for complete avatar collection

**Sink 2: Mini-Me Companion Purchases**
- Each mini-me spawn costs coins (spent when activated)
- Types and costs:
  - Scout: 50 coins
  - Gunner: 75 coins
  - Shield: 100 coins
  - Decoy: 100 coins
  - Collector: 75 coins
  - Stun: 125 coins
  - Healer: 125 coins
- Average weekly usage: 500-1000 coins (depending on play style)

**Sink 3: Revival System**
- Revival cost increases exponentially per revive
- Formula: `100 * (2^reviveCount)` coins
- Examples per run:
  - 1st revive: 100 coins
  - 2nd revive: 200 coins
  - 3rd revive: 400 coins
  - 4th revive: 800 coins
  - 5th revive: 1600 coins
- Limits availability but provides comeback mechanic

**Sink 4: Power-Up Purchases** (Future)
- Inventory-based power-up purchases
- Costs: 3-10 coins per power-up type
- Not in initial implementation

### Coin Economy Balance

**Weekly Earning**:
- Daily coins: 3 coins/day × 7 days = 21 coins/week
- Prestige completions (varies): 10-50 coins/week (depends on player skill)
- Average: 30-70 coins/week

**Weekly Spending**:
- Avatar purchases (amortized): ~10 coins/week
- Mini-mes (light usage): ~10 coins/week
- Revivals (if used): 0-50 coins/week
- Total: ~20-70 coins/week

**Progression Timeline**:
- Tier 1 avatar (500 coins): 7-17 weeks for first purchase
- Tier 2 avatar (1500 coins): 3-4 months with prestige completion
- Tier 3 avatar (3000 coins): 2-4 months with efficient prestige gains
- Full collection (20,000 coins): 6-12 months for dedicated players

**Prestige Bonus Impact**:
- Major boost at each prestige level
- Coin doubling creates exponential benefit at higher prestiges
- Prestige 7→8 gives 256 coins (purchasing power spike)
- Incentivizes prestige climbing for coin accumulation

### Coin Service Implementation

**File**: `src/services/coinService.ts`

**Functions Required**:
- `getAvailableCoins()` - Return current balance
- `addCoins(amount, source)` - Add coins with source tracking
- `spendCoins(amount, purpose)` - Deduct coins
- `getPrestigeReward(prestigeLevel)` - Calculate prestige reward
- `grantPrestigeReward(prestigeLevel)` - Award prestige coins
- `getDailyCoins()` - Return daily allocation
- `canAfford(cost)` - Check if coins sufficient
- `getReviveCost(reviveCount)` - Calculate revival cost
- `getLastDailyReset()` - Timestamp of last daily reset

**Registry Keys**:
- `coinBalance` - Current coin count
- `lastDailyReset` - Timestamp of last reset
- `coinHistory` - Array of earn/spend transactions (for analytics)

**Persistence**:
- Key: `neonSentinel_coins`
- Key: `neonSentinel_lastDailyReset`
- Load on start, save after every transaction

---

## ❤️ Health & Damage System

### Health Bar System Mechanics

**System Overview**: Replace single-life system with **5 health bars**, each representing a segment of the player's durability.

**Health Properties**:
- Base: 5 health bars (full)
- Minimum: 0 health bars (dead)
- Maximum: 5 health bars (cannot exceed)
- No intermediate values (whole bar system)

### Damage System

**Enemy Collision Damage**:
- Regular enemy collision: -1 health bar
- Invincibility period: 1000ms after damage
- Invisibility power-up: Prevents all damage

**Enemy Bullet Damage**:
- Regular enemy bullet: -1 health bar
- Boss/graduation boss bullet: -2 health bars (more lethal)
- Prestige 5+ boss bullets: -2.5 health bars (lethal at prestige 5+)
- Increases with prestige for difficulty scaling

**Game Over Condition**:
- Health bars reach 0
- Show game over screen
- Display revive option if coins sufficient

### Health Bar UI

**HUD Display**:
- Position: Top-left, below/near score
- Visual: 5 neon green bar segments
- Label: "HEALTH: X/5"
- Animation: Brief red flash on damage
- Empty bars: Darker/grayed out version

**Animation Effects**:
- Damage taken: Screen shake + damage indicator
- At 1 health: Pulsing red warning effect
- Recovery (power-up): Smooth green fill animation

### Revival Integration

**Revival Mechanics**:
- On game over: Check if coins sufficient for revival
- If yes: Show "REVIVE FOR X COINS?" option
- On revival:
  - Restore all 5 health bars
  - Continue from current layer/prestige
  - Increment revive count (increases future cost)
  - Deduct coins from balance
- Track revive count per run in registry

**Revive UI**:
- Game over screen shows revival option
- Display cost: "Revive for X coins?"
- Countdown timer (5 seconds before auto-decline)
- Accept/Decline buttons

### Power-Up Health Integration

**Life Orbs**:
- Pickup: Restore 1 health bar
- Multiple pickups: Stack restoration (max 5)
- Capped at 5 health bars (cannot overheal)
- Visual feedback: "+1 Health" floating text

**Configuration Updates**:
- PLAYER_CONFIG: Remove `initialLives: 1`, add `initialHealthBars: 5`
- POWERUP_CONFIG: Update life orb mechanic
- Registry: Track `healthBars` instead of `lives`

---

## ⚡ Power-Up Evolution & Mini-Me Companions

### Mini-Me Companion System

**System Overview**: Players can spawn personal mini-me helpers during gameplay, up to 7 simultaneously.

**Mini-Me Properties**:
- **Max Active**: 7 simultaneously
- **Duration**: 10-15 seconds per deployment
- **Cost**: 50-125 coins per deployment
- **Behavior**: Follow player, perform type-specific actions
- **Inventory**: Stored and purchased from inventory

### Mini-Me Types

**Type 1: Scout**
- Cost: 50 coins
- Behavior: Flies ahead, reveals enemy spawns
- Benefit: +200px vision range, highlights incoming enemies
- Visual: Small drone sprite with scanning effect

**Type 2: Gunner**
- Cost: 75 coins
- Behavior: Shoots alongside player
- Benefit: +50% firepower (equivalent to one extra bullet)
- Visual: Armed mini-sentinel

**Type 3: Shield**
- Cost: 100 coins
- Behavior: Creates protective barrier
- Benefit: -1 damage per hit (shields 1 damage)
- Visual: Energy shield sprite around player

**Type 4: Decoy**
- Cost: 100 coins
- Behavior: Draws enemy fire
- Benefit: Enemies prioritize decoy (player takes 30% less damage)
- Visual: Holographic duplicate

**Type 5: Collector**
- Cost: 75 coins
- Behavior: Gathers nearby power-ups
- Benefit: Automatically collects power-ups within 300px radius
- Visual: Vacuum/collector bot

**Type 6: Stun**
- Cost: 125 coins
- Behavior: Emits stun pulses
- Benefit: Nearby enemies stunned for 1 second every 2 seconds
- Visual: Sparking orb

**Type 7: Healer**
- Cost: 125 coins
- Behavior: Restores player health
- Benefit: +1 health bar every 3 seconds (up to max 5)
- Visual: Healing aura effect

### Mini-Me Inventory System

**File**: `src/services/inventoryService.ts`

**Functions Required**:
- `getInventory()` - Return all inventory slots
- `addMiniMe(type, quantity)` - Add to inventory
- `useMiniMe(type)` - Consume from inventory
- `getMiniMeCount(type)` - Get quantity of specific type
- `canActivate(type)` - Check if inventory sufficient + coins sufficient
- `activateMiniMe(type, coins)` - Spawn and consume

**Inventory Storage**:
- Key: `neonSentinel_miniMeInventory`
- Structure: `{ scout: 5, gunner: 3, shield: 2, ... }`
- Cap: 20 per type (prevents hoarding)
- Persisted: Survives across sessions

### Mini-Me Implementation in GameScene

**Spawning Mechanics**:
- Create `miniMes` group (Phaser.Physics.Arcade.Group)
- On activation:
  - Create mini-me sprite at player position + offset
  - Add to group
  - Start duration timer
  - Perform type-specific behavior
  - Increment mini-me count in registry

**Update Loop**:
- For each mini-me:
  - Update position (follow player with offset)
  - Execute type-specific behavior (shoot, heal, etc.)
  - Check duration timer
  - Remove on expiration

**Destruction**:
- Mini-me survives 3 enemy hits before despawning
- On destruction: Play explosion effect
- Does NOT drop power-ups
- Remove from active count

**Active Count Display**:
- HUD shows: "Mini-Mes: X/7"
- Show active mini-me types and remaining duration
- Warn if trying to spawn 8th

### Inventory UI Component

**File**: `src/components/InventoryModal.tsx`

**Features**:
1. **Grid Layout**: 3×3 grid showing 9 mini-me slots
2. **Item Display**: Icon, name, quantity, coin cost
3. **Purchase Flow**:
   - Click mini-me
   - Show confirmation: "Purchase X for Y coins?"
   - Click confirm → deduct coins → add to inventory
4. **Activation**:
   - Click active mini-me in inventory
   - Show: "Activate X for Y coins?"
   - Confirm → spawn immediately + deduct coins
5. **Information**:
   - Hover: Show mini-me description
   - Benefits: Show stat/effect improvements
   - Duration: Show how long mini-me stays active

**Access Points**:
- Pause menu: "Inventory" button
- Landing page: "Inventory" tab
- Only accessible when paused or on landing page

### Inventory UI on Landing Page

**Dedicated Inventory Section**:
1. Current coin balance (top-right)
2. Mini-me grid with all types
3. Show owned quantity
4. Show coin cost
5. Quick-purchase buttons
6. Manage inventory (adjust quantities)

---

## 👾 Enemy Progression & Naming System

### Enemy Variant System

**Progression Philosophy**: Enemies evolve visually and mechanically as prestige increases, with unique names per variant.

### Enemy Naming Convention

**Format**: `{Color}{Type}{Prestige Variant}`

**Examples**:
- Prestige 0-1 Green Pawns: "Green Pawn" → `greenPawn1`
- Prestige 2-3 Green Pawns: "Jade Sentinel" → `greenPawn2`
- Prestige 4-5 Green Pawns: "Emerald Vanguard" → `greenPawn3`
- Prestige 6+ Green Pawns: "Abyssal Pawn" → `greenPawnCorrupted`

### Color-Specific Enemy Evolution

**Green Enemies (Corruption Fragments)**:
- Prestige 0-1: "Green Pawn" (basic)
- Prestige 2-3: "Jade Sentinel" (slightly corrupted)
- Prestige 4-5: "Emerald Vanguard" (heavily corrupted)
- Prestige 6+: "Abyssal Fragment" (fully corrupted)

**Yellow Enemies (Attack Routines)**:
- Prestige 0-1: "Yellow Routine" (basic attack code)
- Prestige 2-3: "Amber Striker" (enhanced routine)
- Prestige 4-5: "Golden Assault" (combat-optimized)
- Prestige 6+: "Corrupted Sentinel" (malevolent routine)

**Blue Enemies (Hijacked Bots)**:
- Prestige 0-1: "Blue Bot" (basic hijacked system)
- Prestige 2-3: "Cyan Enforcer" (enhanced hijack)
- Prestige 4-5: "Azure Guardian" (autonomous hijack)
- Prestige 6+: "Void Entity" (fully converted)

**Purple Enemies (AI Cores)**:
- Prestige 0-1: "Purple Core" (basic intelligence)
- Prestige 2-3: "Violet Intelligence" (evolved AI)
- Prestige 4-5: "Magenta Overlord" (advanced AI)
- Prestige 6+: "Infernal Mind" (corrupted superintelligence)

### Boss Naming System

**Graduation Boss Names** (Per Layer + Prestige):

**Layer 1 Bosses** (Green variants):
- Prestige 0-1: "Green Guardian 1" (sprite: `greenBoss1`)
- Prestige 2-3: "Jade Guardian 2" (sprite: `greenBoss2`)
- Prestige 4-5: "Emerald Guardian 3" (sprite: `greenBoss3`)
- Prestige 6+: "Abyssal Overlord" (sprite: `greenBossCorrupted`)

**Layer 2 Bosses** (Yellow variants):
- Prestige 0-1: "Yellow Sentinel 1" (sprite: `yellowBoss1`)
- Prestige 2-3: "Amber Sentinel 2" (sprite: `yellowBoss2`)
- Prestige 4-5: "Golden Overlord" (sprite: `yellowFinalBoss`)
- Prestige 6+: "Corrupted Prime" (sprite: `yellowFinalBossCorrupted`)

**Layer 3 Bosses** (Blue variants):
- Prestige 0-1: "Blue Hijack-Core 1" (sprite: `blueBoss1`)
- Prestige 2-3: "Cyan Command 2" (sprite: `blueBoss2`)
- Prestige 4-5: "Azure Authority 3" (sprite: `blueBoss3`)
- Prestige 6+: "Void Entity Prime" (sprite: `blueBossCorrupted`)

**Layer 4 Bosses** (Purple variants):
- Prestige 0-1: "Purple Core-Emperor 1" (sprite: `purpleBoss1`)
- Prestige 2-3: "Violet Intellect 2" (sprite: `purpleBoss2`)
- Prestige 4-5: "Magenta Sovereign 3" (sprite: `purpleBoss3`)
- Prestige 6+: "Infernal Overlord" (sprite: `purpleBossCorrupted`)

**Layer 5 Bosses** (Wrap to Green):
- Prestige 0-1: "Neon Guardian 1" (sprite: `greenBoss1`)
- Prestige 2-3: "System Protector 2" (sprite: `greenBoss2`)
- Prestige 4-5: "Terminal Sentinel 3" (sprite: `greenBoss3`)
- Prestige 6+: "Swarm Executor" (sprite: `greenBossCorrupted`)

**Layer 6 Bosses** (Prestige Boss - wrap to Yellow):
- Prestige 0-1: "Prestige Guardian I" (sprite: `yellowBoss1`)
- Prestige 1-2: "Prestige Sentinel II" (sprite: `yellowBoss2`)
- Prestige 2-3: "Prestige Overlord III" (sprite: `yellowBoss2`)
- Prestige 3-4: "Prestige Emperor IV" (sprite: `yellowFinalBoss`)
- Prestige 4-5: "Prestige Sovereign V" (sprite: `yellowFinalBoss`)
- Prestige 5-6: "Prestige Deity VI" (sprite: `yellowFinalBossCorrupted`)
- Prestige 6-7: "Prestige Tyrant VII" (sprite: `yellowFinalBossCorrupted`)
- Prestige 8: "Zrechostikal - The Swarm Overlord" (special final boss)

### Enemy Stat Scaling per Prestige

**Health Scaling**:
- Base formula: `baseHealth * layerHealthMultiplier * prestigeScalingFactor`
- Scaling: `1.0 + (0.2 * prestigeLevel)`
- Example: Green enemy in Prestige 3
  - Base health: 2
  - Layer multiplier: 1.0 (Layer 1)
  - Prestige factor: 1.0 + (0.2 × 3) = 1.6
  - Final: 2 × 1.0 × 1.6 = **3.2 health**

**Speed Scaling**:
- Increase: 5-10% per prestige level
- Bonus formula: `baseSpeed × (1.0 + 0.05 * prestigeLevel)`

**Points Scaling**:
- Bonus: 10% per prestige level
- Formula: `basePoints × (1.0 + 0.1 * prestigeLevel)`

### Enemy Service Implementation

**File**: `src/services/enemyService.ts`

**Functions Required**:
- `getEnemySpriteKey(type, prestige, isBoss)` - Return sprite texture key
- `getEnemyDisplayName(type, prestige)` - Return lore-friendly name
- `getEnemyStats(type, prestige)` - Return scaled stats
- `getEnemyVariant(prestige)` - Return variant number (1-3+)

**Sprite Mapping Configuration**:
```
ENEMY_SPRITE_MAP = {
  green: {
    pawn: {
      prestige0_1: "greenPawn1",
      prestige2_3: "greenPawn2",
      prestige4_5: "greenPawn3",
      prestige6: "greenPawnCorrupted"
    },
    boss: {
      prestige0_1: "greenBoss1",
      prestige2_3: "greenBoss2",
      prestige4_5: "greenBoss3",
      prestige6: "greenBossCorrupted"
    }
  },
  // Similar for yellow, blue, purple
}
```

---

## 💬 Dialogue & Character Interaction

### Dialogue System Architecture

**File**: `src/game/dialogue/DialogueManager.ts`

**Core Concept**: Lightweight, trigger-based dialogue system that displays character dialogue at key story moments.

### Dialogue Triggers

**Trigger 1: Game Start**
- Speaker: White Sentinel
- Example: "Sentinel, you have been assigned to liberate Neon Terminal. The Swarm has corrupted this system for 50 aeons. Proceed with caution."
- Conditions: First run only (check achievement)

**Trigger 2: Layer Start** (First time in prestige)
- Speaker: White Sentinel
- Example at Prestige 3 Layer 1: "You have discovered something... The Swarm's presence deepens. New entities emerge."
- Conditions: First layer of new prestige

**Trigger 3: Boss Encounter**
- Speaker: Boss/Prestige Overlord
- Example: "I am the Guardian of the Boot Sector. You shall not pass."
- Conditions: Boss spawn event

**Trigger 4: Boss Defeat**
- Speaker: White Sentinel or Prime Sentinel (if unlocked)
- Example: "Excellent work, Sentinel. The path forward is clear."
- Conditions: Boss defeated event

**Trigger 5: Prestige Completion**
- Speaker: White Sentinel → Prime Sentinel (at P3+)
- Example: "You have reached a new level of understanding. Evolution awaits."
- Conditions: Prestige level increase event

**Trigger 6: Final Boss Encounter** (Prestige 8, Layer 6)
- Speaker: Prime Sentinel
- Example: "This is it, Sentinel. Before you stands Zrechostikal itself. Defeat this entity, and you shall become Prime Sentinel. For the Grid."
- Conditions: Prestige 8 Layer 6

**Trigger 7: Final Boss Defeat**
- Speaker: Prime Sentinel
- Example: "You have done it. Terminal Neon is liberated. Rise, Prime Sentinel."
- Conditions: Zrechostikal defeated

### Dialogue Data Structure

**File**: `src/game/lore/dialogues.ts`

**Format**:
```typescript
interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  trigger: string;
  prestige?: number;
  layer?: number;
  condition?: (state) => boolean;
}
```

**Example Set** (Prestige 0-2 progression):
```
Dialogue ID: "game_start"
Speaker: "White Sentinel"
Text: "Sentinel, you have been assigned to Terminal Neon. The Swarm waits. Begin your ascent."

Dialogue ID: "prestige1_layer1"
Speaker: "White Sentinel"
Text: "You advance deeper. The terminal awakens to your presence."

Dialogue ID: "prestige1_boss"
Speaker: "[Boss Name]"
Text: "I am the Guardian of Layer 6. Your intrusion ends here!"
```

### Dialogue UI Component

**File**: `src/components/DialogueCard.tsx`

**Display Features**:
1. **Card Position**: Center-bottom of screen
2. **Speaker Name**: Top-left with character indicator
3. **Character Portrait** (optional): Small sprite/icon
4. **Dialogue Text**: Typewriter effect (100-200ms per char)
5. **Background**: Semi-transparent with speaker color
6. **Auto-dismiss**: 5 seconds or on click
7. **Animation**: Fade in/out

**UI Layout**:
```
┌──────────────────────────────────────────┐
│ [Icon] White Sentinel                   │
├──────────────────────────────────────────┤
│ "Sentinel, you have been assigned to     │
│  Terminal Neon. The Swarm waits. Begin   │
│  your ascent."                           │
└──────────────────────────────────────────┘
```

### Dialogue Integration Points

**In GameScene.ts**:
- At `create()`: Check for game start dialogue
- At layer start: Check for prestige/layer dialogue
- At boss spawn: Play boss introduction
- At boss defeat: Play victory dialogue
- At prestige completion: Play evolution dialogue
- At final boss: Play final briefing

**In UIScene.ts**:
- Listen for dialogue events
- Display dialogue card when triggered
- Handle auto-dismiss timer
- Store viewed dialogue in achievements

### Dialogue Persistence

**Track Viewed Dialogues**:
- Key: `neonSentinel_viewedDialogues`
- Structure: Array of dialogue IDs
- Show checkmark on replay for read dialogues
- Prevent duplicate dialogue spam

---

## 🎯 Bullet Upgrade System

### Bullet Upgrade Tiers

**Tier System**: 5 progression tiers unlocked by prestige level

**Tier 1: Standard Bullet** (Prestige 0)
- Sprite: Current bullet (unchanged)
- Damage: 1.0x base
- Speed: 1.0x base (600 px/s)
- Effect: None
- Default, always active

**Tier 2: Enhanced Bullet** (Prestige 1+)
- Sprite: `bulletTier2` (slightly larger, faint glow)
- Damage: 1.2x base
- Speed: 1.1x base (660 px/s)
- Effect: Small energy trail
- Unlock: Reach Prestige 1

**Tier 3: Accelerated Bullet** (Prestige 3+)
- Sprite: `bulletTier3` (bright, trailing effect)
- Damage: 1.4x base
- Speed: 1.3x base (780 px/s)
- Effect: Energy trail, brighter glow
- Unlock: Reach Prestige 3

**Tier 4: Plasma Bullet** (Prestige 5+)
- Sprite: `bulletTier4` (large, pulsing energy)
- Damage: 1.6x base
- Speed: 1.5x base (900 px/s)
- Effect: Plasma pulse, piercing (goes through 2 enemies)
- Unlock: Reach Prestige 5

**Tier 5: Transcendent Bullet** (Prestige 7+)
- Sprite: `bulletTier5` (massive beam)
- Damage: 2.0x base
- Speed: 1.8x base (1080 px/s)
- Effect: Full piercing (goes through all enemies), multicolor glow
- Unlock: Reach Prestige 7

### Bullet Upgrade Service

**File**: `src/services/bulletUpgradeService.ts`

**Functions Required**:
- `getCurrentBulletTier()` - Return current tier (1-5)
- `getBulletStats(tier)` - Return damage, speed, effects
- `isTierUnlocked(tier)` - Check unlock status
- `getTierUnlockPrestige(tier)` - Return required prestige
- `applyBulletUpgrade(tier)` - Apply to game

### Bullet Integration

**In GameScene.shoot()**:
1. Get current bullet tier via service
2. Get bullet stats (damage, speed, sprite)
3. Apply damage multiplier to bullet damage value
4. Apply speed multiplier to bullet velocity
5. Use upgraded sprite if available
6. Add visual effects (trail, glow, piercing)

**Piercing Mechanic**:
- Tier 1-3: No piercing (1 hit per bullet)
- Tier 4: Pierce 2 enemies (bullet continues)
- Tier 5: Full piercing (bullet never stops)

### Visual Feedback

**In HUD**:
- Display: "Bullet Tier: X/5"
- Show progress: Which tiers available
- Show unlock requirement for next tier

**In Profile**:
- List current bullet tier
- Show visual comparison of bullet sprites
- Show unlock timeline

---

## 👑 Final Boss & Prime Sentinel Ending

### Zrechostikal - The Swarm Overlord

**Encounter Details**:
- **Location**: Prestige 8, Layer 6
- **Trigger**: Defeat Layer 6 prestige boss
- **Health**: Massive, scales with prestige
- **Attacks**: Multi-phase battle with escalating difficulty
- **Reward**: Prime Sentinel promotion

### Final Boss Health & Difficulty

**Health Calculation**:
- Base health: 1000
- Prestige scaling: `1000 * (2.0 + 0.5 * prestigeLevel)` at P8
- Final at Prestige 8: `1000 × 5.0 = 5000 health`
- Difficulty: Extreme multi-phase combat

### Multi-Phase Battle Structure

**Phase 1: Manifestation** (Health: 100% → 75%)
- Zrechostikal emerges
- Basic attack: Projectile spread (5 shots in cone)
- Dialogue: "You dare challenge me? I am the Swarm."
- Assault: 20 seconds, 5 second rest

**Phase 2: Acceleration** (Health: 75% → 50%)
- Attack speed increases
- New attack: Homing projectiles
- Dialogue: "Your defenses are crumbling."
- Assault: 15 seconds, 3 second rest
- Enemy spawn: Regular enemies + reinforcements

**Phase 3: Corruption** (Health: 50% → 25%)
- Visual effects intensify (glitching, distortion)
- New attack: Stun shockwave (forces stun for 2 seconds)
- Dialogue: "I have infected galaxies. You are nothing."
- Assault: 18 seconds, 2 second rest
- Spawn rate: Heavy enemy waves

**Phase 4: Desperation** (Health: 25% → 0%)
- Boss takes on fully corrupted form
- Maximum aggression
- All previous attacks + enhanced versions
- Dialogue: "Impossible... I am eternal..."
- Final moment dialogue: "I... am... defeated..."
- Assault: 25 seconds, 1 second rest

### Final Boss Sprite & Visuals

**Sprite Asset**: `zrechostikal` or `finalBoss`
- Massive entity (3x normal boss size or larger)
- Corrupted appearance with glowing effects
- Morphs between phases (visual transformation)
- Particle effects (corruption aura, energy bursts)

### Victory & Prime Sentinel Promotion

**On Zrechostikal Defeat**:
1. Boss death animation
2. Screen fade to white
3. Prime Sentinel dialogue: "Rise, Sentinel. You have liberated Terminal Neon. You are now Prime Sentinel - Rank: Neon Sentinel."
4. Transformation scene: Player avatar transforms into Prime Sentinel form
5. Victory screen appears

**Rewards**:
- Achievement: "Prime Sentinel"
- Rank: Upgraded to Rank 18 "Prime Sentinel"
- Avatar Unlock: "Transcendent Form (Platinum Ascended)" for 7500 coins
- Badge: Permanent "Prime Sentinel" badge on profile
- Special cosmetic: Glowing effect on player sprite
- Leaderboard title highlight

**Profile Updates**:
- Flag: `isPrimeSentinel = true`
- Display: Prime Sentinel badge/icon
- Permanent rank marking
- Special leaderboard positioning

### Ending Sequence

**Victory Cutscene**:
1. Final boss defeated animation
2. Terminal visual repair/stabilization
3. Prime Sentinel final message: "Terminal Neon is liberated. You have ascended beyond Sentinel. You are Prime Sentinel now. Legendary status achieved."
4. Fade to credits/ending screen

**Post-Game**:
- Player can continue playing at higher prestiges (if implemented)
- OR Game ends with victory screen
- Show all achieved ranks and avatars
- Encourage replay/new game+

---

## ⚙️ Configuration System Updates

### New Configuration Sections in config.ts

#### 1. AVATAR_CONFIG
```
avatarTiers: {
  tier1: { /* Azure Core, Violet Prototype, etc. */ },
  tier2: { /* Guardian Core, Sniper Kernel, etc. */ },
  tier3: { /* Neon Guardian, Void Sentinel, etc. */ },
  tier4: { /* Prime Sentinel, Transcendent Form */ }
}

Each avatar contains:
- name
- description
- unlockPrestige
- unlockCostCoins
- stats: { speedMult, fireRateMult, healthMult, damageMult }
- sprite
```

#### 2. PRESTIGE_CONFIG (Updated)
```
prestigeTiers: [
  {
    level: 0,
    name: "The Entry",
    difficultyMultiplier: 1.0,
    scoreMultiplier: 1.0,
    coinReward: 2,
    avatarUnlock: "azure_core"
  },
  // ... continues through tier 8
]

finalBossPrestige: 8
```

#### 3. RANK_CONFIG
```
ranks: [
  { number: 1, prestige: 0, layer: 1, name: "Initiate Sentinel", badge: "badge_1" },
  { number: 2, prestige: 0, layer: 3, name: "Trial Sentinel", badge: "badge_2" },
  // ... continues through rank 18
]
```

#### 4. ENEMY_VARIANT_MAP
```
Colors: green, yellow, blue, purple
Types: pawn, boss

Structure:
green: {
  pawn: { prestige0_1: "greenPawn1", prestige2_3: "greenPawn2", ... },
  boss: { prestige0_1: "greenBoss1", prestige2_3: "greenBoss2", ... }
}

Names mapped separately in ENEMY_NAMES
```

#### 5. DIALOGUE_CONFIG
```
dialogues: [
  {
    id: "game_start",
    speaker: "White Sentinel",
    text: "...",
    trigger: "gameStart",
    conditions: { firstRun: true }
  },
  // ... more dialogues
]
```

#### 6. BULLET_UPGRADE_CONFIG
```
tiers: [
  { tier: 1, damageMultiplier: 1.0, speedMultiplier: 1.0, ... },
  { tier: 2, damageMultiplier: 1.2, speedMultiplier: 1.1, unlockPrestige: 1, ... },
  // ... continues through tier 5
]
```

#### 7. COIN_CONFIG
```
prestigeRewardFormula: "2 * (2^prestigeLevel)"
dailyPrimeSentinelBonus: 3
revivalBaseCost: 100
revivalCostMultiplier: 2

mini-meCosts: { scout: 50, gunner: 75, ... }
```

#### 8. MINI_ME_CONFIG
```
types: {
  scout: { cost: 50, duration: 15000, spriteKey: "miniMeScout", ... },
  gunner: { cost: 75, duration: 12000, spriteKey: "miniMeGunner", ... },
  // ... all 7 types
}

maxActive: 7
```

### Updated Registry Keys

**New keys to track**:
- `healthBars` - Current health (0-5)
- `currentPrestige` - Current prestige level
- `currentLayer` - Current layer (1-6)
- `currentRank` - Current rank name/number
- `currentAvatar` - Active avatar ID
- `bulletTier` - Current bullet upgrade tier
- `reviveCount` - Revives used in current run
- `miniMeCount` - Active mini-mes count
- `coinBalance` - Current coins
- `isPrimeSentinel` - Flag for Prime Sentinel status
- `prestigeHistory` - Array of completed prestiges

---

## 🎨 Asset Integration & Mapping

### Asset Inventory

**Location**: `public/sprites/` (organized by type)

**Avatar Sprites** (in `/avatars/`):
- `heroGrade1Blue` - Default sentinel
- `heroGrade2Purple` - Violet Interceptor
- `heroGrade2Red` - Crimson Artillery
- `heroGrade2Orange` - Guardian Core
- `heroGrade2White` - Sniper Kernel
- ... variants for grades 3-5

**Enemy Sprites** (in `/enemies/`):
- `greenPawn1`, `greenPawn2`, `greenPawn3`, `greenPawnCorrupted`
- `greenBoss1`, `greenBoss2`, `greenBoss3`, `greenBossCorrupted`
- Similar for yellow, blue, purple
- `yellowFinalBoss`, `yellowFinalBossCorrupted`

**Boss Sprite** (in `/bosses/`):
- `zrechostikal` - Final boss (massive sprite)

**Mini-Me Sprites** (in `/powerups/`):
- `miniMeScout`, `miniMeGunner`, `miniMeShield`
- `miniMeDecoy`, `miniMeCollector`, `miniMeStun`, `miniMeHealer`

**Bullet Sprites** (in `/bullets/`):
- `bulletTier1` (current)
- `bulletTier2` - Enhanced
- `bulletTier3` - Accelerated
- `bulletTier4` - Plasma
- `bulletTier5` - Transcendent

**Rank Badges** (in `/badges/`):
- `badge_1` through `badge_18`
- `badge_prime_sentinel`

**UI Assets** (in `/ui/`):
- Coin icon
- Health bar graphics
- Mini-me icons
- Prestige icons

### Sprite Loading in BootScene

**Update `BootScene.load()`**:
1. Load all avatar sprites
2. Load all enemy variants
3. Load all boss sprites
4. Load all mini-me sprites
5. Load all bullet tiers
6. Load all rank badges
7. Verify all assets load without error
8. Implement fallback for missing assets

**Fallback Strategy**:
- If prestige-specific sprite missing: Use base sprite
- If custom avatar missing: Use default sprite
- If mini-me missing: Show placeholder
- Log warnings but don't crash game

---

## 🖥️ UI/UX Updates & Components

### Landing Page Updates

**New Sections**:
1. **Avatar Selection**:
   - Current avatar display with stats
   - "Change Avatar" button → opens modal
   - Show prestige requirement badges

2. **Inventory Section**:
   - Mini-me grid with quantities
   - Show coin costs
   - Quick-purchase buttons

3. **Rank Display**:
   - Current rank with badge
   - Progress to next rank
   - Rank history link

4. **Coin Display**:
   - Current balance (top-right)
   - Daily coins info
   - Prestige rewards earned

### Game HUD Updates

**Health Bar Display**:
- Position: Top-left
- Show: "HEALTH: X/5" with visual bars
- Animate on damage/heal

**Prestige/Layer Indicator**:
- Position: Top-center
- Show: "Prestige X - Layer Y"
- Color-coded per prestige

**Active Mini-Mes**:
- Position: Top-right
- Show: "Mini-Mes: X/7"
- List active types with duration bars

**Coin Balance**:
- Position: Top-right (below score)
- Show: Coin icon + amount
- Update on earn/spend

**Bullet Tier**:
- Position: Right side
- Show: Bullet Tier indicator
- Show upgrade progress

### Pause Menu Updates

**New Options**:
- Inventory button → opens inventory modal
- Show coin balance
- Show active mini-mes
- Show current avatar stats

### Game Over Screen Updates

**Revival Option**:
- Prominent "REVIVE FOR X COINS?" button
- Only shows if coins sufficient
- Countdown timer (5 seconds)

**Rank Progression**:
- Show current rank
- Show progress to next rank
- List milestones achieved this run

**Score Summary**:
- Final score
- Prestige/layer reached
- Coin rewards earned
- Enemies defeated

### Profile Page Updates

**New Sections**:
1. **Rank Information**:
   - Current rank with badge
   - Rank history timeline
   - Progress to next rank

2. **Avatar Gallery**:
   - Show all purchased avatars
   - Highlight current active
   - Show locked avatars with requirements

3. **Statistics**:
   - Total coins earned/spent
   - Highest prestige
   - Mini-mes used lifetime
   - Prestige completions

4. **Prime Sentinel Badge** (if unlocked):
   - Prominent display
   - Special background/effect

### Dialogue Display Component

**File**: `src/components/DialogueCard.tsx`

**Features**:
- Center-bottom position during gameplay
- Speaker name + character indicator
- Typewriter text effect
- Auto-dismiss after 5 seconds
- Semi-transparent background
- Fade in/out animation

### Inventory Modal Component

**File**: `src/components/InventoryModal.tsx`

**Layout**:
- 3×3 grid (7 mini-me types + space)
- Each slot shows: Icon, name, quantity, cost
- Purchase/activate buttons
- Info panel with descriptions

---

## ✅ Testing, Validation & Balance

### Unit Testing Plan

**Services to Test**:
1. **avatarService.ts**:
   - Avatar unlock logic
   - Stat application
   - Persistence

2. **coinService.ts**:
   - Earning calculation
   - Spending validation
   - Balance persistence

3. **rankService.ts**:
   - Rank calculation
   - Rank progression
   - Badge assignment

4. **bulletUpgradeService.ts**:
   - Tier unlock logic
   - Stat application
   - Visual updates

5. **inventoryService.ts**:
   - Mini-me storage
   - Purchase logic
   - Inventory persistence

6. **storyService.ts**:
   - Dialogue triggers
   - Story progression
   - Milestone tracking

### Integration Testing Plan

**Flows to Test**:
1. **Prestige Completion Flow**:
   - Complete Layer 6
   - Defeat prestige boss
   - Receive coins
   - Unlock new avatar
   - Advance to next prestige

2. **Avatar System Flow**:
   - Select avatar on landing page
   - Stats apply in game
   - Switch avatar between runs
   - Purchase new avatars

3. **Coin Economy Flow**:
   - Earn coins from prestige
   - Spend coins on mini-mes
   - Revive and pay escalating cost
   - Daily Prime bonus

4. **Health/Damage Flow**:
   - Take enemy damage (-1 health bar)
   - Take boss damage (-2 health bars)
   - Collect life orb (+1 health bar)
   - Game over at 0 health bars
   - Revive restores 5 health bars

5. **Mini-Me Flow**:
   - Purchase mini-me from inventory
   - Activate during game
   - Mini-me spawns and acts
   - Despawn after duration
   - Inventory updates

6. **Enemy Progression Flow**:
   - Prestige 0 enemies appear as basic
   - Prestige 3 enemies show variant 2 sprites
   - Boss names update per prestige
   - Stat scaling applies

7. **Dialogue Flow**:
   - Game start dialogue appears
   - Prestige dialogue shows on prestige complete
   - Boss dialogue shows on spawn
   - No duplicate dialogues

8. **Final Boss Flow**:
   - Prestige 8, Layer 6 triggers final boss
   - Zrechostikal spawns with special sprite
   - Multi-phase battle plays out
   - Victory triggers Prime Sentinel promotion
   - Profile updates with badge

### Gameplay Testing Plan

**Play-Through Scenarios**:
1. **Complete Prestige 0-8 Run**: Play all prestiges to completion
2. **Avatar Progression**: Unlock and use all avatars
3. **Mini-Me Management**: Activate various mini-mes in combat
4. **Revival System**: Test revive mechanics at high cost
5. **Enemy Difficulty**: Verify enemies get harder each prestige
6. **Dialogue Coverage**: See all dialogue triggers
7. **Rank Achievement**: Hit all rank milestones
8. **Final Boss Fight**: Complete Zrechostikal encounter

### Balance Testing Plan

**Coin Economy Balance**:
- Verify prestige reward formula: `2 * (2^prestigeLevel)`
- Check avatar costs are achievable in reasonable time
- Mini-me costs feel meaningful but not punishing
- Revive cost escalation prevents infinite revives

**Enemy Difficulty Balance**:
- Each prestige feels harder but fair
- Boss health scales appropriately
- Prestige 8 is extremely challenging but winnable

**Avatar Balance**:
- No avatar is mandatory
- Highest tier avatar provides 50% boost (not overpowering)
- Cosmetic appeal doesn't override mechanical balance

**Health System Balance**:
- 5 health bars feel appropriate for arcade shooter
- Enemy damage (-1) vs boss damage (-2) scaling
- Revival cost escalation balances health recovery

### Edge Case Testing

**Scenarios to Test**:
1. Max mini-mes active (7) - warn on 8th
2. Max health bars (5) - cannot overheal
3. Coin overflow (very large balance)
4. Multiple revives in single run
5. Prestige boundary transitions
6. Missing sprite assets (fallbacks)
7. Dialogue repeat attempts
8. Final boss at all prestige levels

### UI/UX Testing

**Component Testing**:
1. Avatar selector modal responsiveness
2. Inventory modal purchase flow
3. Dialogue card display timing
4. Rank badge rendering
5. Health bar animations
6. HUD element positioning
7. Mobile responsiveness

---

## 📋 Implementation Phases & Timeline

### Phase 1: Core Systems (Week 1)
**Duration**: 3-4 days

**Deliverables**:
1. Health bar system implementation
   - Replace lives with health bars
   - Implement damage system
   - Update UI display

2. Coin economy foundation
   - Implement prestige coin rewards
   - Set up coin persistence
   - Create coin service

3. Avatar service foundation
   - Define avatar config
   - Create avatar service
   - Implement avatar stats application

**Files Modified**: 
- `config.ts`, `GameScene.ts`, `coinService.ts`, `avatarService.ts`

### Phase 2: Progression Systems (Week 1-2)
**Duration**: 3-4 days

**Deliverables**:
1. Prestige structure refactor
   - Update PRESTIGE_CONFIG (8 levels instead of infinite)
   - Track prestige/layer progression
   - Update boss spawning logic

2. Rank system implementation
   - Create rank service
   - Define 18 rank tiers
   - Implement rank progression tracking
   - Add rank display to UI

3. Enemy progression
   - Implement enemy sprite variants per prestige
   - Add enemy naming system
   - Create enemy service
   - Implement stat scaling

**Files Modified**:
- `config.ts`, `GameScene.ts`, `rankService.ts`, `enemyService.ts`

### Phase 3: Power-Ups & Inventory (Week 2)
**Duration**: 3-4 days

**Deliverables**:
1. Mini-me companion system
   - Define 7 mini-me types
   - Implement mini-me spawning in GameScene
   - Create mini-me behavior logic

2. Inventory system
   - Create inventory service
   - Build inventory persistence
   - Implement mini-me purchasing

3. Inventory UI
   - Create InventoryModal component
   - Add inventory to landing page
   - Add inventory button to pause menu

**Files Modified**:
- `config.ts`, `GameScene.ts`, `inventoryService.ts`, `InventoryModal.tsx`

### Phase 4: Story & Dialogue (Week 2-3)
**Duration**: 3-4 days

**Deliverables**:
1. Story service
   - Create story service
   - Define story arcs (8 prestige levels)
   - Implement story progression tracking

2. Dialogue system
   - Create DialogueManager
   - Define dialogue database
   - Implement dialogue triggers

3. Dialogue UI
   - Create DialogueCard component
   - Integrate with UIScene
   - Implement auto-dismiss

**Files Modified**:
- `storyService.ts`, `DialogueManager.ts`, `DialogueCard.tsx`, `UIScene.ts`

### Phase 5: Avatar System & UI (Week 3)
**Duration**: 3-4 days

**Deliverables**:
1. Avatar selection UI
   - Create avatar selector modal
   - Add to landing page
   - Implement purchase flow

2. Avatar application
   - Apply avatar stats at game start
   - Update sprite based on avatar
   - Store avatar selection persistently

3. Profile enhancements
   - Add rank display
   - Add avatar gallery
   - Add prestige history

**Files Modified**:
- `LandingPage.tsx`, `ProfilePage.tsx`, `GameScene.ts`, `avatarService.ts`

### Phase 6: Bullet Upgrades & Polish (Week 3-4)
**Duration**: 2-3 days

**Deliverables**:
1. Bullet upgrade system
   - Create bullet upgrade service
   - Define 5 tiers with stats
   - Implement tier unlocking

2. Bullet application
   - Apply upgrades to bullets
   - Update visual effects
   - Add piercing mechanic

3. HUD updates
   - Add bullet tier display
   - Add mini-me counter
   - Add prestige indicator

**Files Modified**:
- `bulletUpgradeService.ts`, `GameScene.ts`, `UIScene.ts`, `config.ts`

### Phase 7: Final Boss & Ending (Week 4)
**Duration**: 2-3 days

**Deliverables**:
1. Final boss implementation
   - Design Zrechostikal sprite
   - Implement multi-phase battle
   - Create final boss dialogue

2. Prime Sentinel promotion
   - Implement promotion logic
   - Create victory cutscene
   - Update profile with badge
   - Add achievement tracking

3. Game ending sequence
   - Create victory screen
   - Implement end sequence
   - Prepare for potential new game+

**Files Modified**:
- `GameScene.ts`, `finalBossConfig`, `profilePage.tsx`

### Phase 8: Testing & Balance (Week 4-5)
**Duration**: 3-5 days

**Deliverables**:
1. Comprehensive testing
   - Unit tests for all services
   - Integration tests for flows
   - Gameplay balance testing
   - Edge case validation

2. Balance adjustments
   - Tweak coin economy if needed
   - Adjust enemy difficulty
   - Fine-tune avatar stats
   - Polish gameplay feel

3. Documentation
   - Update PLAYER_BIBLE.md
   - Update DEVELOPER_BIBLE.md
   - Update README.md
   - Create testing checklist

**Total Duration**: 4-5 weeks with focused development

---

## 📝 Documentation Updates Required

### PLAYER_BIBLE.md Updates
- Add "The Story" section (50 aeons lore, Prime Sentinel goal)
- Add "Prestige Structure" section (6x6 system explained)
- Add "Avatar System" section (unlocking and selection)
- Add "Rank System" section (18 ranks and milestones)
- Add "Mini-Me Companions" section (7 types and usage)
- Update "Coin System" section (prestige rewards, daily bonus)
- Add "Health Bar System" section (5-bar mechanic)
- Update "Final Boss" section (Zrechostikal multi-phase battle)
- Add "Prime Sentinel" section (achieving ultimate goal)

### DEVELOPER_BIBLE.md Updates
- Add new configuration sections (AVATAR_CONFIG, RANK_CONFIG, etc.)
- Document new services (avatarService, rankService, bulletUpgradeService, etc.)
- Update architecture diagrams
- Document new registry keys
- Add sprite mapping documentation
- Document dialogue system architecture
- Add mini-me implementation details

### README.md Updates
- Update features list to include all new systems
- Add prestige structure to overview
- Update configuration documentation
- Add new services to project structure
- Update asset structure

---

## 🎯 Summary & Checklist

### Core Features Implemented
- [x] Story & Narrative Arc (8 prestige levels, Prime Sentinel goal)
- [x] Avatar System (4 tiers, prestige-locked, coin costs)
- [x] Prestige Structure (6x6 system, 8 regular + 1 final)
- [x] Rank System (18 ranks, bragging rights)
- [x] Coin Economy (prestige rewards, daily bonus, spending)
- [x] Health Bar System (5-bar mechanic, damage scaling)
- [x] Mini-Me Companions (7 types, inventory-based)
- [x] Enemy Progression (variants per prestige, naming)
- [x] Dialogue System (character interactions, triggers)
- [x] Bullet Upgrades (5 tiers, damage/speed scaling)
- [x] Final Boss (Zrechostikal, multi-phase, Prime Sentinel promotion)
- [x] Revival System (escalating costs, gameplay continuation)

### Quality Assurance Checklist
- [ ] All services created and tested
- [ ] Config sections complete and validated
- [ ] UI components built and responsive
- [ ] Gameplay balance verified
- [ ] Coin economy sustainable
- [ ] Avatar progression achievable
- [ ] All dialogues implemented
- [ ] Final boss winnable and challenging
- [ ] No major bugs or memory leaks
- [ ] Mobile responsive design maintained
- [ ] Asset loading and fallbacks working
- [ ] Persistence working across sessions

---

**Ready for Development**

This comprehensive guide combines all three suggestion documents into one unified roadmap. Share with your development team or AI assistant to begin implementation with clear direction and minimal back-and-forth.

**Last Updated**: January 27, 2026
**Status**: Ready for Implementation
**Estimated Duration**: 4-5 weeks
