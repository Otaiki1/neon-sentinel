import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@starknet-react/core';
import {
  getLeaderboardEntries,
  getPlayerLeaderboardEntries,
  normalizeAddress,
  type LeaderboardEntryNode,
} from '../services/dojoService';
import { useDojo } from '../components/DojoContext';
import './LandingPage.css';
import './ProfilePage.css';

function shortAddr(addr: string) {
  if (!addr) return 'Anonymous';
  const a = addr.replace(/^0x0*/, '0x');
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function hexScore(hex: string | number): number {
  if (typeof hex === 'number') return hex;
  return parseInt(String(hex), 16) || 0;
}

function LeaderboardPage() {
  // Use DojoContext — profile is already loaded & address is resolved
  const { profile } = useDojo();
  const { address, isConnected } = useAccount();

  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntryNode[]>([]);
  const [myEntries, setMyEntries] = useState<LeaderboardEntryNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [global, mine] = await Promise.all([
        getLeaderboardEntries(50),
        address ? getPlayerLeaderboardEntries(address) : Promise.resolve([]),
      ]);
      setGlobalEntries(global);
      setMyEntries(mine);
    } catch {
      // silently ignore poll errors
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Initial fetch + re-fetch when address changes
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Real-time polling every 30 seconds
  useEffect(() => {
    const id = setInterval(() => fetchData(false), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const myBestScore = myEntries.length > 0 ? hexScore(myEntries[0].final_score) : 0;
  const myRank = myBestScore > 0
    ? globalEntries.findIndex(e =>
        normalizeAddress(e.player_address) === normalizeAddress(address ?? '')) + 1
    : null;

  return (
    <div className="profile-page min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
      {/* Background — matches ProfilePage */}
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
          <h1 className="profile-title">HALL OF FAME</h1>
          <Link to="/" className="profile-back">&gt; BACK</Link>
        </header>

        {/* MY RANKING */}
        <div className="profile-panel mb-4">
          <h2 className="profile-panel-title">MY RANKING</h2>
          {loading ? (
            <div className="profile-value-dim">Loading on-chain data...</div>
          ) : !isConnected || !address ? (
            <div className="profile-value-dim">Connect your wallet to see your ranking.</div>
          ) : !profile && myEntries.length === 0 ? (
            <div className="profile-value-dim">No runs found on-chain yet. Play a run to appear here.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="profile-label">Global Rank</div>
                <div className="profile-value">{myRank ? `#${myRank}` : '--'}</div>
              </div>
              <div>
                <div className="profile-label">Best Score</div>
                <div className="profile-value">
                  {profile?.best_run_score
                    ? hexScore(profile.best_run_score).toLocaleString()
                    : myBestScore > 0 ? myBestScore.toLocaleString() : '--'}
                </div>
              </div>
              <div>
                <div className="profile-label">Total Runs</div>
                <div className="profile-value">{profile?.total_runs ?? '--'}</div>
              </div>
              <div>
                <div className="profile-label">Lifetime Score</div>
                <div className="profile-value">
                  {profile?.lifetime_score
                    ? hexScore(profile.lifetime_score).toLocaleString()
                    : '--'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MY RUNS */}
        {isConnected && myEntries.length > 0 && (
          <div className="profile-panel mb-4">
            <h2 className="profile-panel-title">MY RUNS</h2>
            <div className="profile-stat-list">
              {myEntries.slice(0, 5).map((e, i) => (
                <div key={e.run_id || i} className="flex items-center justify-between py-2 border-b border-neon-green border-opacity-20 last:border-0">
                  <span>
                    <span className="rank-badge font-score text-base mr-2">{i + 1}</span>
                    <span className="profile-label">Week {e.week}</span>
                  </span>
                  <span className="profile-value">{hexScore(e.final_score).toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL-TIME LEADERBOARD */}
        <div className="text-center mb-4">
          <p className="font-body text-sm text-neon-green opacity-60">Top players · On-chain verified</p>
        </div>

        <div className="profile-panel">
          <h2 className="profile-panel-title">ALL-TIME LEADERBOARD</h2>
          {loading ? (
            <div className="profile-value-dim text-center py-4">Loading...</div>
          ) : globalEntries.length === 0 ? (
            <div className="profile-value-dim text-center py-4">NO RUNS YET</div>
          ) : (
            <div className="profile-stat-list">
              {globalEntries.slice(0, 20).map((entry, index) => {
                const isMe = address &&
                  normalizeAddress(entry.player_address) === normalizeAddress(address);
                return (
                  <div
                    key={entry.run_id || index}
                    className={`flex items-center justify-between py-2 border-b border-neon-green border-opacity-20 last:border-0 ${isMe ? 'bg-neon-green bg-opacity-5' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="rank-badge font-score text-base">{index + 1}</span>
                      <span className={`font-score text-sm ${isMe ? 'text-yellow-400' : 'text-neon-green'}`}>
                        {shortAddr(entry.player_address)}
                        {isMe && <span className="ml-2 text-xs opacity-80">▶ YOU</span>}
                      </span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="profile-value">{hexScore(entry.final_score).toLocaleString()} pts</span>
                      <span className="profile-label text-[10px]">Wk {entry.week}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
