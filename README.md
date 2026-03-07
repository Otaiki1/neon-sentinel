# 🎮 Neon Sentinel

> **A retro arcade shooter set in a collapsing digital megasystem**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-green)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-5.1-purple)](https://vitejs.dev/)

Neon Sentinel is a 2D retro web arcade shooter where you play as an autonomous security program fighting to contain The Swarm—a spreading corruption threatening to collapse The Grid. Push deeper into infected system layers, defeat graduation bosses, and climb the weekly leaderboards.

---

## 🎯 Features

-   **Retro Arcade Gameplay**: Classic shooter mechanics with modern polish
-   **Endless Prestige Loop**: Complete Layer 6 to enter Prestige Mode and loop back harder
-   **7 Power-Up Types**: Speed, fire rate, score multiplier, auto-shoot, lives, firepower, invisibility
-   **Synergy Enemies**: Shield drones, echo decoys, fragmenters, and buff auras
-   **Graduation Boss System**: Defeat bosses to unlock new layers
-   **Dynamic Difficulty Evolution**: Enemy behavior changes over time (formations, prediction, coordinated fire)
-   **Corruption Meter**: Risk-reward system that boosts score and enemy aggression
-   **Overclock Mode**: Manual mid-run boost with cooldown and charge limits
-   **Shock Bomb**: Area-of-effect ability that kills 70% of on-screen enemies
-   **God Mode**: Temporary invincibility ability with meter-based activation
-   **Coin System**: Daily coins for special features and rewards
-   **Pregame Upgrades**: Spend coins before a run for session-only boosts (extra health, damage, fire rate, etc.)
-   **Achievements & Badges**: Meta-progression with unlockable cosmetics
-   **Profile & Customization**: Unlock heroes, skins, kernels; view rank, stats, and progress (prestige/layer)
-   **Mid-Run Challenges**: Random micro-challenges with bonus rewards
-   **Rotating Layer Modifiers**: Time-based layer variants with unique constraints
-   **Almost Success Feedback**: Game over insights that nudge another run
-   **Kernel Playstyles**: Sidegrade classes with distinct movement/fire traits
-   **Sensory Escalation**: Scanlines, glitching, and haptics ramp with danger
-   **Run Stats HUD**: Live survival time, accuracy, and dodge tracking
-   **Floating Combat Text**: Damage numbers, combo pings, and milestones
-   **Lives System**: Collect Life Orbs (capped at 20 lives = 4 orbs)
-   **Weekly Leaderboards**: On-chain via Torii, automatically tracking Top 10 with Cartridge username resolution
-   **Hall of Fame**: Dedicated leaderboard page with historical records
-   **Wallet Integration**: Login gasless with passkeys via Cartridge Controller
-   **Mobile Support**: On-screen joystick + fire button with adjustable sensitivity
-   **Neon Aesthetic**: Retro brutalist design with neon green theme
-   **PWA Ready**: Installable app with service worker auto-updates

---

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+ and npm/yarn
-   Modern web browser

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd neon-sentinel

# Install dependencies
yarn install

# Start development server
yarn dev
```

The game will be available at `http://localhost:5173`

### Build for Production

```bash
yarn build
```

The production build will be in the `dist/` directory.

---

## 📁 Project Structure

```
neon-sentinel/
├── src/
│   ├── game/              # Phaser game code
│   │   ├── config.ts      # Game configuration
│   │   ├── Game.ts        # Phaser initialization
│   │   └── scenes/        # Game scenes
│   ├── pages/             # React pages
│   ├── components/        # React components
│   ├── services/          # Business logic
│   └── assets/            # Static assets
├── public/               # Public assets
│   └── sprites/          # Game sprites
├── dist/                # Build output
└── README.md            # This file
```

---

## 🎮 How to Play

### Desktop Controls

-   **WASD** or **Arrow Keys**: Move
-   **Spacebar** or **Mouse Click**: Shoot
-   **Q**: Activate Overclock Mode or God Mode (when ready)
-   **B**: Activate Shock Bomb (when ready)
-   **ESC**: Pause/Resume
-   **R**: Restart (when game over)
-   **M**: Return to Menu

### Mobile Controls

-   **Virtual Joystick**: Move your Sentinel
-   **Fire Button**: Shoot
-   **Pause Button**: Top-right
-   **Landscape mode recommended**

### Gameplay

1. **Survive**: Enemies spawn from the right side and move toward you
2. **Shoot**: Destroy enemies to score points
3. **Collect**: Grab power-ups and Life Orbs for advantages
4. **Progress**: Reach score thresholds to unlock new layers
5. **Defeat Bosses**: Beat graduation bosses to advance layers
6. **Climb Leaderboards**: Compete for weekly top scores with prestige levels

---

## 📚 Documentation

### For Players

-   **[Player's Bible](./PLAYER_BIBLE.md)**: Complete gameplay guide, story, enemies, power-ups, strategies

### For Developers

-   **[Developer's Bible](./DEVELOPER_BIBLE.md)**: Technical documentation, architecture, configuration, implementation details
-   **[Data Structures](./DATASTRUCTURES.md)**: localStorage keys, Phaser Registry, service types, and data flow

---

## 🛠️ Tech Stack

-   **Framework**: React 18 + TypeScript
-   **Game Engine**: Phaser 3.90.0
-   **Build Tool**: Vite 5.1.4
-   **Styling**: Tailwind CSS 3.4.0
-   **Wallet & Blockchain**: Cartridge Controller, Starknet React, Dojo, Torii
-   **Routing**: React Router DOM 7.12.0
-   **Data**: TanStack Query 5, Torii GraphQL
-   **PWA**: Vite PWA + Workbox

---

## 🎨 Game Systems

### Layers

The game features 6 system layers, each with increasing difficulty:

1. **Boot Sector** (0 points) - Green grid
2. **Firewall** (500 points) - Yellow grid
3. **Security Core** (1,500 points) - Blue grid
4. **Corrupted AI** (4,000 points) - Purple grid
5. **Kernel Breach** (10,000 points) - Red grid
6. **System Collapse** (25,000 points) - Bright red grid

### Prestige Mode

- **Unlock**: Defeat the Layer 6 graduation boss
- **Loop**: Return to Layer 1 with higher difficulty and score multipliers
- **Scaling**: Multipliers increase each prestige cycle and continue scaling indefinitely
- **Visuals**: Grid hue shifts, glitch jitter, and screen flashes intensify with prestige

### Dynamic Difficulty Evolution

- **Phases**: Difficulty evolves based on run time (learning → prediction → coordinated fire → adaptive)
- **Behaviors**: Predictive movement, coordinated fire, space denial, adaptive spawns
- **Spawn Patterns**: Formations, ambush waves, and boss rushes introduced in later phases

### Corruption Meter

- **Meter**: Global 0-100 corruption level that rises over time
- **Risk/Reward**: Higher corruption boosts score multipliers but increases enemy difficulty
- **Triggers**: Corrupted zones, boss defeats, no-hit streaks, and high combos raise corruption

### Overclock Mode

- **Activation**: Press `Q` to trigger a timed power surge (when ready)
- **Effects**: Faster movement and firing, higher score, more enemy spawns
- **Limits**: Cooldown between activations and a max number per run

### Shock Bomb

- **Unlock**: Reach 10,000 lifetime score to unlock
- **Activation**: Press `B` to activate (when meter is full)
- **Effect**: Instantly kills 70% of all enemies on screen
- **Meter**: Fills over time during gameplay (~2 seconds to fill)
- **Cooldown**: 30 seconds after use before meter starts refilling

### God Mode

- **Unlock**: Reach 25,000 lifetime score to unlock
- **Activation**: Press `Q` to activate (when meter is full)
- **Effect**: 10 seconds of complete invincibility
- **Meter**: Fills over time during gameplay (~3.3 seconds to fill)
- **Cooldown**: 40 seconds after use before meter starts refilling
- **Note**: Shares Q key with Overclock - whichever is ready activates first

### Achievements & Badges

- **Unlocks**: Earn badges and cosmetics for milestones
- **Progress**: Tracked in the pause menu with percent progress
- **Cosmetics**: Select unlocked cosmetics in the Hall of Fame page

### Mid-Run Challenges

- **Triggers**: Start after the first minute, then rotate every few minutes
- **Objectives**: No-shoot survival, clean kill streaks, combo holds, bullet dodges
- **Rewards**: Bonus score, extra lives, temporary multipliers

### Rotating Layer Modifiers

- **Rotation**: Real-time modifiers rotate every few hours
- **Announcements**: Upcoming modifier revealed 15 minutes before a shift
- **Effects**: Speed caps, input lag, vision limits, random pauses, speed-linked scoring
- **Challenge Runs**: Modifier runs appear on a dedicated Challenge Leaderboard

### Almost Success Feedback

- **Game Over Insights**: Highlights how close you were to milestones
- **Targets**: Next layer threshold, score milestones, leaderboard proximity
- **Celebrations**: Best weekly run, new personal bests for kills/combo/corruption

### Kernel Playstyles

- **Selection**: Choose a Kernel on the landing page before each run
- **Sidegrades**: Speed, fire rate, piercing, and durability trade-offs
- **Unlocks**: Progress milestones unlock additional Kernels

### Coin System

- **Daily Coins**: Receive 3 coins daily (resets at midnight)
- **Usage**: Pregame upgrades (session-only boosts), revives, marketplace, and special features
- **Pregame Upgrades**: Before starting a run, spend coins on extra health, max health cap, bullet damage, fire rate, power-up duration, or movement speed for that run only
- **Tracking**: View available coins on the landing page and in the pregame upgrades modal

### Sensory Escalation

- **Layer FX**: Scanlines and distortion intensify as you progress
- **Critical Corruption**: Screen pulses red at 75%+ corruption
- **UI Glitching**: HUD flicker ramps in deeper layers
- **Haptics**: Vibrations on kills, boss defeats, damage, and power-ups

### Run Stats HUD

- **Live Metrics**: Survival time, enemies defeated, accuracy, dodges, shots
- **Run Summary**: Detailed breakdown on game over

### Enemies

-   **Green**: Basic enemies (10 points, 2 health)
-   **Yellow**: Faster enemies (25 points, 2 health)
-   **Yellow Shield Drone**: Protects nearby enemies (50% damage reduction)
-   **Yellow Echo**: Creates decoy echoes to distract
-   **Blue**: Shooting enemies (50 points, 4 health) ⚠️
-   **Blue Buff**: Boosts nearby enemy fire rate and damage
-   **Purple**: Elite enemies (100 points, 6 health)
-   **Purple Fragmenter**: Splits into multiple greens on death
-   **Red**: Layer 5 enemies and bosses (500 points, 20 health)
-   **Flame Red**: Layer 6 enemies and graduation bosses (same tier, distinct visuals)

### Power-Ups

-   **Speed Boost**: 1.5x movement speed (10s)
-   **Fire Rate Boost**: 2x shooting speed (10s)
-   **Score Multiplier**: 2x points (15s)
-   **Auto-Shoot**: Continuous shooting (5s)
-   **Life Orb**: +2 lives (capped at 20 lives = 4 orbs)
-   **Firepower Upgrade**: Multi-bullet shots (15s)
-   **Invisibility**: Invincibility (10s)

**Spawn Rates** (reduced for better balance):
- **Life Orbs**: 12% chance from all enemies
- **Firepower**: 5% chance from all enemies
- **Invisibility**: 10% chance from all enemies
- **Other Power-Ups**: 15% chance from purple/red enemies or bosses

---

## 🔧 Configuration

All game configuration is in `src/game/config.ts`:

-   `PLAYER_CONFIG`: Player speed, bullet speed, fire rate, lives
-   `ENEMY_CONFIG`: Enemy stats, health, speed, points
-   `LAYER_CONFIG`: Layer thresholds, enemies, difficulty + boss multipliers
-   `SPAWN_CONFIG`: Spawn rates, intervals, max enemies
-   `POWERUP_CONFIG`: Power-up types, durations, effects
-   `UI_CONFIG`: Fonts, colors, sizes
-   `PRESTIGE_CONFIG`: Prestige tiers, multipliers, and visuals
-   `DIFFICULTY_EVOLUTION`: Timed phases and behavior/spawn evolution
-   `ENEMY_BEHAVIOR_CONFIG`: Predictive lead time, coordination range, adaptation tuning
-   `CORRUPTION_SYSTEM`: Corruption thresholds, bonuses, score/enemy multipliers
-   `OVERCLOCK_CONFIG`: Overclock activation, cooldown, and effects
-   `LEADERBOARD_CATEGORIES`: Category titles, metrics, and rewards
-   `MID_RUN_CHALLENGES`: Challenge list, timing, rewards, UI settings
-   `ACHIEVEMENTS`: Achievement tiers, rewards, and cosmetics
-   `ROTATING_LAYER_MODIFIERS`: Modifier definitions and spawn multipliers
-   `FAILURE_FEEDBACK`: Game over feedback metrics and celebration cues
-   `PLAYER_KERNELS`: Kernel definitions, multipliers, and unlock rules
-   `SENSORY_ESCALATION`: Tempo, screen effects, UI glitching, and haptics
-   `runStats` (registry): Live session stats for HUD + summary

See [Developer's Bible](./DEVELOPER_BIBLE.md) for detailed configuration documentation.

---

## 📱 Mobile Support

The game is fully optimized for mobile devices:

-   **Touch Controls**: On-screen joystick + fire button
-   **Sensitivity Settings**: Adjustable joystick sensitivity in pause menu
-   **Responsive Scaling**: All sprites scaled to 50% on mobile
-   **UI Optimization**: Scaled-down UI elements for better visibility
-   **Landscape Mode**: Recommended for best gameplay experience

---

## 🏆 Leaderboards

-   **Weekly Reset**: Leaderboards reset every ISO week (stored on-chain and indexed via Torii)
-   **In-Game Top 10**: Displayed securely from the Torii indexer on game over
-   **Hall of Fame**: `/leaderboard` page highlighting the top players alongside their Cartridge username
-   **Wallet Integration**: Connect with Cartridge (passkey/session) to attach on-chain records to your profile
-   **Anonymous Mode**: Play without wallet (scores show as "Anonymous" and won't be committed on-chain)

---

## 👤 Profile & Customization

- **Profile Page**: Access via main menu; compact neon-themed layout with rank, bullet tier, kernels, stats, Prime Sentinel status, lifetime & best run, rank history, heroes & skins, quick bests
- **Current Progress**: True prestige and layer stored separately for unlock checks (avatars, kernels); profile shows this progress
- **Heroes & Skins**: Unlock different Sentinel heroes and cosmetic skins
- **Lifetime Stats**: Total score, playtime, enemies defeated
- **Best Run Stats**: Detailed breakdown of best performance
- **Achievements**: All achievements and progress
- **Recent Records**: Personal bests across metrics

## 🎯 Development

### Running Locally

```bash
# Development server
yarn dev

# Production build
yarn build

# Preview production build
yarn preview
```

### Environment Variables

If connecting to a custom Torii deploy or Katana node, you configure details in `src/dojo/config.ts`. Otherwise, it points to the standard Cartridge endpoints.

### Code Style

-   TypeScript strict mode enabled
-   ESLint for code quality
-   Prettier for formatting (if configured)

### Testing

Currently no automated tests. Manual testing recommended for:

-   Gameplay mechanics
-   Collision detection
-   Power-up effects
-   Layer progression
-   Mobile controls

---

## 🐛 Known Issues

-   Anonymous scores do not participate in the global on-chain leaderboard
-   No sound effects or music
-   Limited sprite variety for some power-ups
-   Overclock and God Mode both use Q key (whichever is ready activates)

---

## 🚧 Roadmap

### Planned Features

-   [ ] Backend API integration
-   [ ] Sound effects and music
-   [ ] Tournament mode
-   [ ] Replay system
-   [ ] Additional enemy types
-   [ ] More power-up varieties
-   [ ] Save/load progress
-   [ ] Separate key bindings for Overclock and God Mode

---

## 📄 License

[Add your license here]

---

## 👥 Contributors

[Add contributors here]

---

## 🙏 Acknowledgments

-   Phaser.js for the excellent game framework
-   Cartridge for seamless zero-gas wallet onboarding and passkey sessions
-   Dojo Engine for the underlying on-chain state components and indexing
-   All sprite artists and designers

---

## 📞 Support

For issues, questions, or contributions, please [open an issue](link-to-issues) or [contact the team](link-to-contact).

---

**Built with ❤️ by the Neon Sentinel team**

_Last Updated: 2026-02-04 (Documentation & data structures update)_
