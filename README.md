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
-   **Achievements & Badges**: Meta-progression with unlockable cosmetics
-   **Mid-Run Challenges**: Random micro-challenges with bonus rewards
-   **Rotating Layer Modifiers**: Time-based layer variants with unique constraints
-   **Almost Success Feedback**: Game over insights that nudge another run
-   **Kernel Playstyles**: Sidegrade classes with distinct movement/fire traits
-   **Sensory Escalation**: Scanlines, glitching, and haptics ramp with danger
-   **Lives System**: Collect Life Orbs for unlimited lives
-   **Weekly Leaderboards**: In-game top scores with prestige level tracked
-   **Hall of Fame**: Dedicated leaderboard page with rotating categories
-   **Wallet Integration**: Connect wallet or play anonymously
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

---

## 🛠️ Tech Stack

-   **Framework**: React 18 + TypeScript
-   **Game Engine**: Phaser 3.90.0
-   **Build Tool**: Vite 5.1.4
-   **Styling**: Tailwind CSS 3.4.0
-   **Wallet**: Dynamic Labs SDK v4 + Wagmi + viem
-   **Routing**: React Router DOM 7.12.0
-   **Data**: TanStack Query 5
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

- **Activation**: Press `Q` to trigger a timed power surge
- **Effects**: Faster movement and firing, higher score, more enemy spawns
- **Limits**: Cooldown between activations and a max number per run

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

### Sensory Escalation

- **Layer FX**: Scanlines and distortion intensify as you progress
- **Critical Corruption**: Screen pulses red at 75%+ corruption
- **UI Glitching**: HUD flicker ramps in deeper layers
- **Haptics**: Vibrations on kills, boss defeats, damage, and power-ups

### Enemies

-   **Green**: Basic enemies (10 points, 2 health)
-   **Yellow**: Faster enemies (25 points, 2 health)
-   **Yellow Shield Drone**: Protects nearby enemies (50% damage reduction)
-   **Yellow Echo**: Creates decoy echoes to distract
-   **Blue**: Shooting enemies (50 points, 4 health) ⚠️
-   **Blue Buff**: Boosts nearby enemy fire rate and damage
-   **Purple**: Elite enemies (100 points, 6 health)
-   **Purple Fragmenter**: Splits into multiple greens on death
-   **Red**: Bosses (500 points, 20 health)

### Power-Ups

-   **Speed Boost**: 1.5x movement speed (10s)
-   **Fire Rate Boost**: 2x shooting speed (10s)
-   **Score Multiplier**: 2x points (15s)
-   **Auto-Shoot**: Continuous shooting (5s)
-   **Life Orb**: +2 lives (no cap)
-   **Firepower Upgrade**: Multi-bullet shots (15s)
-   **Invisibility**: Invincibility (10s)

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

-   **Weekly Reset**: Leaderboards reset every ISO week (localStorage)
-   **In-Game Top 10**: Displayed on game over screen with auto-hide (includes prestige)
-   **Hall of Fame**: `/leaderboards` page with weekly featured categories + all-time records
-   **Challenge Leaderboard**: Weekly modifier runs (non-standard layers) in Hall of Fame
-   **Wallet Integration**: Connect wallet to attach address to scores
-   **Anonymous Mode**: Play without wallet (scores show as "Anonymous")

---

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

Create a `.env` file with:

```
VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_labs_environment_id
```

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

-   Leaderboard uses localStorage (mock implementation)
-   Anonymous scores still appear as "Anonymous" on the local leaderboard
-   No sound effects or music
-   Limited sprite variety for some power-ups

---

## 🚧 Roadmap

### Planned Features

-   [ ] Backend API integration
-   [ ] Sound effects and music
-   [ ] Achievement system
-   [ ] Tournament mode
-   [ ] Replay system
-   [ ] Additional enemy types
-   [ ] More power-up varieties
-   [ ] Save/load progress

---

## 📄 License

[Add your license here]

---

## 👥 Contributors

[Add contributors here]

---

## 🙏 Acknowledgments

-   Phaser.js for the excellent game framework
-   Dynamic Labs for wallet integration
-   All sprite artists and designers

---

## 📞 Support

For issues, questions, or contributions, please [open an issue](link-to-issues) or [contact the team](link-to-contact).

---

**Built with ❤️ by the Neon Sentinel team**

_Last Updated: 2026-01_
