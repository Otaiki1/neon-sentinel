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
-   **6 System Layers**: Progress through increasingly difficult layers
-   **7 Power-Up Types**: Speed, fire rate, score multiplier, auto-shoot, lives, firepower, invisibility
-   **5 Enemy Types**: Green, Yellow, Blue, Purple, and Red bosses
-   **Graduation Boss System**: Defeat bosses to unlock new layers
-   **Lives System**: Collect Life Orbs for unlimited lives
-   **Weekly Leaderboards**: Compete for top scores
-   **Wallet Integration**: Connect wallet or play anonymously
-   **Mobile Support**: Touch controls with responsive scaling
-   **Neon Aesthetic**: Retro brutalist design with neon green theme

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

-   **Tap and Hold**: Move (auto-shoots while held)
-   **Landscape mode recommended**

### Gameplay

1. **Survive**: Enemies spawn from the right side and move toward you
2. **Shoot**: Destroy enemies to score points
3. **Collect**: Grab power-ups and Life Orbs for advantages
4. **Progress**: Reach score thresholds to unlock new layers
5. **Defeat Bosses**: Beat graduation bosses to advance layers
6. **Climb Leaderboards**: Compete for weekly top scores

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
-   **Wallet**: Dynamic Labs SDK v4
-   **Routing**: React Router DOM 7.12.0

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

### Enemies

-   **Green**: Basic enemies (10 points, 2 health)
-   **Yellow**: Faster enemies (25 points, 2 health)
-   **Blue**: Shooting enemies (50 points, 4 health) ⚠️
-   **Purple**: Elite enemies (100 points, 6 health)
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
-   `LAYER_CONFIG`: Layer thresholds, enemies, difficulty multipliers
-   `SPAWN_CONFIG`: Spawn rates, intervals, max enemies
-   `POWERUP_CONFIG`: Power-up types, durations, effects
-   `UI_CONFIG`: Fonts, colors, sizes

See [Developer's Bible](./DEVELOPER_BIBLE.md) for detailed configuration documentation.

---

## 📱 Mobile Support

The game is fully optimized for mobile devices:

-   **Touch Controls**: Tap and hold to move and auto-shoot
-   **Responsive Scaling**: All sprites scaled to 50% on mobile
-   **UI Optimization**: Scaled-down UI elements for better visibility
-   **Landscape Mode**: Recommended for best gameplay experience

---

## 🏆 Leaderboards

-   **Weekly Reset**: Leaderboards reset every ISO week
-   **Top 10**: Displayed on game over screen
-   **Wallet Integration**: Connect wallet to attach address to scores
-   **Anonymous Mode**: Play without wallet (scores hidden)

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

_Last Updated: 2026_
