import { Link } from "react-router-dom";
import { LAYER_CONFIG, PRESTIGE_CONFIG, PLAYER_KERNELS, MID_RUN_CHALLENGES, POWERUP_CONFIG } from "../game/config";
import "./LandingPage.css";
import "./ProfilePage.css";

function AboutPage() {
  return (
    <div className="profile-page min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
      {/* Background Image */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/sentinel-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'rgba(0, 0, 0, 0.82)' }}
        aria-hidden
      />
      <div className="fixed inset-0 opacity-8 pointer-events-none animated-grid" />
      
      <div className="relative z-10 profile-container">
        {/* Header */}
        <header className="profile-header">
          <h1 className="profile-title">ABOUT NEON SENTINEL</h1>
          <Link to="/" className="profile-back">&gt; BACK</Link>
        </header>

        {/* The Grid */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">THE GRID</h2>
          <p className="font-body text-sm md:text-base text-neon-green opacity-90 leading-relaxed">
            Inside a collapsing digital megasystem called <strong>The Grid</strong>, autonomous security programs—<strong>Neon Sentinels</strong>—fight to contain a spreading corruption known as <strong>The Swarm</strong>. Each enemy color represents a deeper layer of system corruption. You don't "beat levels"—you push deeper into infected layers of the system until you hit a system collapse (death). The deeper you go, the more dangerous the corruption becomes.
          </p>
        </div>

        {/* System Layers */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">SYSTEM LAYERS</h2>
          <p className="font-body text-sm md:text-base text-neon-green opacity-90 leading-relaxed mb-4">
            The Grid is divided into <strong>6 system layers</strong>. Each layer represents deeper corruption and increasing danger. Reach score thresholds to trigger graduation bosses that unlock the next layer.
          </p>
          <div className="space-y-3">
            {Object.entries(LAYER_CONFIG).map(([layerNum, config]) => (
              <div
                key={layerNum}
                className="border border-neon-green border-opacity-30 p-3 hover:border-opacity-60 transition-all font-body"
                style={{
                  borderLeftColor: `#${config.gridColor.toString(16).padStart(6, '0')}`,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-menu text-base mb-1 text-neon-green">
                      Layer {layerNum}: {config.name}
                    </h3>
                    <p className="text-xs text-neon-green opacity-70 mb-2 font-score tracking-wider">
                      Threshold: {config.scoreThreshold.toLocaleString()} points
                    </p>
                    <div className="text-xs text-neon-green opacity-80">
                      <p>Health Multiplier: {config.healthMultiplier}x</p>
                      <p>Spawn Rate: {config.spawnRateMultiplier.toFixed(1)}x</p>
                      {config.bossChance > 0 && (
                        <p>Boss Chance: {(config.bossChance * 100).toFixed(0)}%</p>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-12 h-12 flex-shrink-0 border-2"
                    style={{
                      backgroundColor: `#${config.gridColor.toString(16).padStart(6, '0')}20`,
                      borderColor: `#${config.gridColor.toString(16).padStart(6, '0')}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Depth */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">SYSTEM DEPTH</h2>
          <p className="font-body text-sm md:text-base text-neon-green opacity-90 leading-relaxed mb-4">
            System Depth measures how far you've penetrated into The Grid's corrupted infrastructure. It combines your layer progression with prestige cycles to create an infinite scaling challenge.
          </p>
          <div className="space-y-3 font-body">
            <div className="border border-neon-green border-opacity-30 p-3">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Layer Progression</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                Start at Layer 1 (Boot Sector) and push through 6 increasingly dangerous layers. Each layer requires reaching a score threshold and defeating a graduation boss. Deeper layers feature tougher enemies, higher health multipliers, and faster spawn rates.
              </p>
            </div>
            <div className="border border-neon-green border-opacity-30 p-3">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Prestige Cycles</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                After completing Layer 6, enter Prestige Mode to loop back to Layer 1 with increased difficulty and score multipliers. Each prestige cycle adds more challenge and reward potential. There's no cap—continue scaling indefinitely to test your limits.
              </p>
            </div>
            <div className="border border-neon-green border-opacity-30 p-3">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Depth Calculation</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                Your total system depth = Current Layer + (Prestige Level × 6). For example, reaching Layer 4 at Prestige 2 means you've penetrated 16 layers deep into The Grid's corruption.
              </p>
            </div>
          </div>
        </div>

        {/* Prestige Mode */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">PRESTIGE MODE</h2>
          <p className="font-body text-sm md:text-base text-neon-green opacity-90 leading-relaxed mb-4">
            Prestige Mode makes the game endless by looping after Layer 6. Defeat the Layer 6 graduation boss to unlock Prestige Mode and loop back to Layer 1 with higher difficulty and score multipliers.
          </p>
          <div className="space-y-2 mb-4 font-body">
            <h3 className="font-menu text-sm text-yellow-500">How It Works:</h3>
            <ul className="text-xs md:text-sm text-neon-green opacity-80 space-y-1 ml-4 list-disc">
              <li><strong>Unlock:</strong> Defeat the Layer 6 graduation boss</li>
              <li><strong>Cycle:</strong> Return to Layer 1 with higher difficulty and score multipliers</li>
              <li><strong>Scaling:</strong> Multipliers increase each cycle; there's no cap</li>
              <li><strong>Visuals:</strong> Grid hue shifts, glitch jitter, and screen flashes intensify with prestige</li>
              <li><strong>Badge:</strong> "Prestige Champion" appears when you reach Prestige {PRESTIGE_CONFIG.maxPrestige}</li>
            </ul>
          </div>
          <div className="border border-neon-green border-opacity-30 p-3 mt-4 font-body">
            <h3 className="font-menu text-sm mb-2 text-neon-green">Prestige Tiers:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {PRESTIGE_CONFIG.prestigeTiers.map((tier) => (
                <div key={tier.level} className="flex justify-between items-center bg-black bg-opacity-40 p-2">
                  <span className="text-neon-green opacity-80">Prestige {tier.level} ({tier.name}):</span>
                  <span className="text-cyan-400 font-score tracking-wider">
                    {tier.difficultyMultiplier}x diff, {tier.scoreMultiplier}x score
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neon-green opacity-60 mt-2 text-center border-t border-neon-green/20 pt-2">
              Complete all 6 layers of each prestige to advance. Max prestige: {PRESTIGE_CONFIG.maxPrestige}.
            </p>
          </div>
        </div>

        {/* Kernels */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">KERNEL PLAYSTYLES</h2>
          <p className="font-body text-sm md:text-base text-neon-green opacity-90 leading-relaxed mb-4">
            Before each run, choose a Kernel that defines your Sentinel's core behavior. Kernels are sidegrades, not upgrades—each offers unique trade-offs between speed, firepower, durability, and special abilities. Unlock new kernels by meeting specific milestones.
          </p>
          <div className="space-y-3 font-body">
            {Object.entries(PLAYER_KERNELS).map(([key, kernel]) => (
              <div
                key={key}
                className="border border-neon-green border-opacity-30 p-3 hover:border-opacity-60 transition-all bg-black bg-opacity-20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-menu text-base text-neon-green">{kernel.name}</h3>
                      {kernel.unlocked && (
                        <span className="text-[10px] text-cyan-400 border border-cyan-400 px-1 py-px font-menu">UNLOCKED</span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-neon-green opacity-80 mb-2">
                      {kernel.description}
                    </p>
                    <div className="text-xs text-neon-green opacity-70 space-y-1">
                      {kernel.baseSpeed !== 1.0 && (
                        <p>Speed: <span className="text-yellow-400">{kernel.baseSpeed > 1 ? '+' : ''}{((kernel.baseSpeed - 1) * 100).toFixed(0)}%</span></p>
                      )}
                      {kernel.fireRate !== 1.0 && (
                        <p>Fire Rate: <span className="text-yellow-400">{kernel.fireRate < 1 
                          ? `+${((1 - kernel.fireRate) * 100).toFixed(0)}% faster`
                          : `${((kernel.fireRate - 1) * 100).toFixed(0)}% slower`}</span></p>
                      )}
                      {"healthPerLife" in kernel && kernel.healthPerLife && (
                        <p>Health: <span className="text-yellow-400">+{((kernel.healthPerLife - 1) * 100).toFixed(0)}% per life</span></p>
                      )}
                      {"bulletPiercing" in kernel && kernel.bulletPiercing && (
                        <p className="text-cyan-400 uppercase tracking-widest mt-1">Special: Bullet Piercing</p>
                      )}
                    </div>
                    {!kernel.unlocked && kernel.unlockCondition && (kernel.unlockCondition as string) !== "default" && (
                      <p className="text-[10px] text-red-500 mt-2 opacity-80 uppercase tracking-wide">
                        Unlock {kernel.unlockCondition.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Systems */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">GAME SYSTEMS</h2>
          <p className="font-body text-sm md:text-base text-neon-green opacity-90 leading-relaxed mb-4">
            Neon Sentinel features multiple interconnected systems that create dynamic, evolving gameplay. Understanding these systems is key to mastering The Grid.
          </p>
          
          <div className="space-y-4 font-body">
            {/* Corruption System */}
            <div className="border border-neon-green border-opacity-30 p-3 bg-black bg-opacity-20">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Corruption Meter</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed mb-2">
                A global risk-reward meter (0-100%) that rises over time. Higher corruption increases score multipliers but makes enemies more dangerous.
              </p>
              <div className="text-xs text-neon-green opacity-70 space-y-1">
                <p>• <span className="text-green-400">Low (0-25%)</span>: 1.0x score, standard enemies</p>
                <p>• <span className="text-yellow-400">Medium (25-50%)</span>: 1.5x score, tougher enemies</p>
                <p>• <span className="text-orange-400">High (50-75%)</span>: 2.0x score, aggressive enemies</p>
                <p>• <span className="text-red-500">Critical (75-100%)</span>: 3.0x score, very dangerous enemies</p>
              </div>
            </div>

            {/* Overclock Mode */}
            <div className="border border-neon-green border-opacity-30 p-3">
              <h3 className="font-menu text-sm mb-2 text-cyan-400">Overclock Mode</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                Manual power surge (Press Q) that boosts speed, fire rate, and score for 15 seconds. Limited activations per run with cooldowns. Enemy spawns increase during Overclock, creating high-risk, high-reward situations.
              </p>
            </div>

            {/* Mid-Run Challenges */}
            <div className="border border-neon-green border-opacity-30 p-3 bg-black bg-opacity-20">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Mid-Run Challenges</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed mb-2">
                Random micro-challenges appear during runs, starting after the first minute. Complete objectives for bonus rewards like extra score, lives, or temporary multipliers.
              </p>
              <div className="text-xs text-neon-green opacity-70 space-y-1">
                {MID_RUN_CHALLENGES.challenges.slice(0, 3).map((challenge) => (
                  <p key={challenge.id}>• <strong>{challenge.title}</strong>: {challenge.description}</p>
                ))}
              </div>
            </div>

            {/* Dynamic Difficulty */}
            <div className="border border-neon-green border-opacity-30 p-3">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Dynamic Difficulty Evolution</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                Enemy behavior evolves over time, not just by score. Enemies begin with simple pursuit, then develop predictive movement, coordinated fire, and adaptive learning. Long runs become increasingly challenging as The Swarm adapts to your playstyle.
              </p>
            </div>

            {/* Rotating Modifiers */}
            <div className="border border-neon-green border-opacity-30 p-3 bg-black bg-opacity-20">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Rotating Layer Modifiers</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                Special modifier runs rotate every few hours, adding unique constraints like speed caps, input lag, vision limits, or random pauses. These challenge runs appear on a dedicated Challenge Leaderboard.
              </p>
            </div>

            {/* Power-Ups */}
            <div className="border border-neon-green border-opacity-30 p-3">
              <h3 className="font-menu text-sm mb-2 text-yellow-500">Power-Ups & Life Orbs</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed mb-2">
                Power-ups spawn from defeated enemies with reduced frequency for better game balance. Life Orbs are capped at 20 lives (4 orbs maximum).
              </p>
              <div className="text-xs text-neon-green opacity-70 space-y-1 border-t border-neon-green border-opacity-20 pt-2 mt-2">
                <p>• Life Orbs: {(POWERUP_CONFIG.livesSpawnChance * 100).toFixed(0)}% spawn chance, +2 lives (max 20)</p>
                <p>• Firepower: {(POWERUP_CONFIG.firepowerSpawnChance * 100).toFixed(0)}% spawn chance</p>
                <p>• Invisibility: {(POWERUP_CONFIG.invisibilitySpawnChance * 100).toFixed(0)}% spawn chance</p>
                <p>• Other Power-Ups: {(POWERUP_CONFIG.spawnChance * 100).toFixed(0)}% from purple/red enemies</p>
              </div>
            </div>

            {/* Graduation Bosses */}
            <div className="border border-neon-green border-opacity-30 p-3 bg-black bg-opacity-20">
              <h3 className="font-menu text-sm mb-2 text-red-500">Graduation Bosses</h3>
              <p className="text-xs md:text-sm text-neon-green opacity-80 leading-relaxed">
                Special bosses required to advance layers. They are 3x larger, 10x tougher, and use assault phases: 15 seconds of aggressive 3-bullet spread shooting, followed by 3 seconds of rest. Defeat them to unlock the next layer.
              </p>
            </div>
          </div>
        </div>

        {/* Gameplay Summary */}
        <div className="profile-panel mb-8">
          <h2 className="profile-panel-title">GAMEPLAY SUMMARY</h2>
          <div className="space-y-4 text-sm md:text-base text-neon-green opacity-90 font-body">
            <div>
              <h3 className="font-menu text-base mb-1 text-yellow-500 border-b-2 border-yellow-500 pb-1 w-max">1. MISSION</h3>
              <p className="leading-relaxed mt-2">
                As a Neon Sentinel, your mission is to survive The Grid as long as possible. Push deeper into corrupted system layers, defeat graduation bosses to unlock new layers, and climb the rigorous Torii-indexed leaderboards to become a Grid Defender.
              </p>
            </div>
            <div>
              <h3 className="font-menu text-base mb-1 text-yellow-500 border-b-2 border-yellow-500 pb-1 w-max">2. PROGRESSION</h3>
              <p className="leading-relaxed mt-2">
                Start in Layer 1 (Boot Sector) and work your way through 6 increasingly difficult layers. Each layer requires a score threshold and defeating a graduation boss. After completing Layer 6, loop back with higher difficulty into Prestige Mode.
              </p>
            </div>
            <div>
              <h3 className="font-menu text-base mb-1 text-yellow-500 border-b-2 border-yellow-500 pb-1 w-max">3. ON-CHAIN SCORING & PROFILES</h3>
              <p className="leading-relaxed mt-2">
                Neon Sentinel uses <strong>Cartridge</strong> for seamless web3 onboarding using passkeys. Build your profile, save your stats, and establish your legacy. Your highest scores and stats are automatically verified by Torii GraphQL indexers, forming the immortal <strong>Hall of Fame</strong>. Be sure to link your Cartridge passkey!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
