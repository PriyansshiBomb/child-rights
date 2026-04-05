import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/gameAPI';
import { useAuth } from '../hooks/useAuth';
import '../App.css';

const Leaderboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLeaderboard(token);
        setLeaderboard(data.leaderboard);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/game')}>
          ◄ Back
        </button>
        <div style={styles.titleRow}>
          <span style={styles.titleDiamond}>◆</span>
          <h1 style={styles.title}>🏆 Leaderboard</h1>
          <span style={styles.titleDiamond}>◆</span>
        </div>
        <button style={styles.exitBtn} onClick={logout}>
          Exit ✕
        </button>
      </div>

      <div style={styles.content}>
        {/* Player banner */}
        <div style={styles.myRankCard}>
          <div style={styles.myRankInner}>
            <span style={styles.myRankIcon}>⚔️</span>
            <div>
              <div style={styles.myRankLabel}>YOUR PROGRESS</div>
              <div style={styles.myRankName}>🧒 {user?.username}</div>
              <div style={styles.myRankSub}>Keep exploring to climb the ranks!</div>
            </div>
            <span style={styles.myRankIcon}>🛡️</span>
          </div>
        </div>

        {/* Leaderboard list */}
        {loading ? (
          <div style={styles.loading}>
            <span style={styles.loadingIcon}>⏳</span>
            Loading rankings...
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '60px', marginBottom: '12px' }}>🌍</div>
            <p>No players yet — be the first on the board!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {leaderboard.map((entry, index) => (
              <div key={entry.userId} style={{
                ...styles.entry,
                ...(index < 3 ? styles.topEntry : {}),
                ...(entry.username === user?.username ? styles.myEntry : {}),
                animationDelay: `${index * 0.08}s`,
              }}>
                {/* Rank */}
                <div style={styles.rank}>
                  {index < 3
                    ? <span style={{ fontSize: '28px' }}>{rankEmojis[index]}</span>
                    : <span style={styles.rankNum}>#{index + 1}</span>
                  }
                </div>

                {/* Avatar + Name */}
                <div style={styles.playerInfo}>
                  <div style={{
                    ...styles.avatar,
                    background: `linear-gradient(135deg, hsl(${index * 47}, 60%, 45%), hsl(${index * 47}, 60%, 30%))`,
                  }}>
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.username}>
                      {entry.username}
                      {entry.username === user?.username && <span style={styles.youTag}> (You)</span>}
                    </div>
                    <div style={styles.subInfo}>Level {entry.level} • {entry.zonesCompleted}/5 zones</div>
                  </div>
                </div>

                {/* XP bar */}
                <div style={styles.xpSection}>
                  <div style={styles.xpNum}>{entry.xp} XP</div>
                  <div style={styles.xpTrack}>
                    <div style={{
                      ...styles.xpFill,
                      width: `${Math.min(100, (entry.xp / (leaderboard[0]?.xp || 1)) * 100)}%`,
                    }} />
                  </div>
                </div>

                {/* Stars */}
                <div style={styles.zones}>
                  {'⭐'.repeat(entry.zonesCompleted)}
                  {'☆'.repeat(Math.max(0, 5 - entry.zonesCompleted))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'transparent',
    color: '#3d2b1f',
    overflow: 'auto',
    fontFamily: "'VT323', monospace",
    position: 'relative',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px',
    background: 'linear-gradient(180deg, #3d2b1f 0%, #5c3d28 50%, #3d2b1f 100%)',
    borderBottom: '4px solid #2a1a0e',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.08)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  backBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 14px',
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3)',
    border: '2px solid #3d2b1f', color: '#3d2b1f',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  titleRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  title: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
    color: '#f5e6c8', textShadow: '2px 2px 0 #2a1a0e',
    margin: 0,
  },
  titleDiamond: { color: '#c19a49', fontSize: '12px' },
  exitBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 14px',
    background: 'linear-gradient(180deg, #c44, #922)',
    border: '2px solid #611', color: '#fdd',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  content: {
    maxWidth: '750px', margin: '0 auto', padding: '24px 20px 80px',
    position: 'relative', zIndex: 2,
  },
  myRankCard: {
    background: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a3 50%, #c4a96a 100%)',
    border: '4px solid #3d2b1f',
    boxShadow: '4px 4px 0px #2a1a0e, inset 2px 2px 0 rgba(255,255,255,0.3)',
    padding: '4px', marginBottom: '24px',
    animation: 'rpgFadeIn 0.4s ease-out',
  },
  myRankInner: {
    border: '2px solid rgba(193,154,73,0.4)',
    padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
  },
  myRankIcon: { fontSize: '28px' },
  myRankLabel: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
    color: '#c19a49', letterSpacing: '2px',
    textAlign: 'center',
  },
  myRankName: {
    fontSize: '26px', fontWeight: 'bold', margin: '4px 0',
    textAlign: 'center', color: '#3d2b1f',
  },
  myRankSub: {
    color: '#7a6542', fontSize: '18px', textAlign: 'center',
  },
  loading: {
    textAlign: 'center', color: '#f5e6c8', padding: '40px',
    fontSize: '22px', fontFamily: "'VT323', monospace",
  },
  loadingIcon: { fontSize: '28px', marginRight: '8px' },
  empty: {
    textAlign: 'center', color: '#f5e6c8', padding: '40px',
    fontSize: '22px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  entry: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3)',
    border: '3px solid #3d2b1f', padding: '12px 16px',
    boxShadow: '3px 3px 0 #2a1a0e, inset 1px 1px 0 rgba(255,255,255,0.3)',
    animation: 'rpgSlideUp 0.4s ease-out both',
  },
  topEntry: {
    borderColor: '#8b6914',
    boxShadow: '3px 3px 0 #2a1a0e, inset 1px 1px 0 rgba(255,255,255,0.3), 0 0 10px rgba(193,154,73,0.3)',
  },
  myEntry: {
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    borderColor: '#8b6914',
  },
  rank: { width: '40px', textAlign: 'center', flexShrink: 0 },
  rankNum: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
    color: '#7a6542',
  },
  playerInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  avatar: {
    width: '38px', height: '38px', borderRadius: '0',
    border: '2px solid #3d2b1f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', color: '#fff', fontSize: '16px', flexShrink: 0,
    fontFamily: "'Press Start 2P', monospace",
    boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
  },
  username: {
    fontWeight: 'bold', fontSize: '20px', color: '#3d2b1f',
  },
  youTag: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
    color: '#8b6914',
  },
  subInfo: { color: '#7a6542', fontSize: '16px', marginTop: '2px' },
  xpSection: { width: '130px', flexShrink: 0 },
  xpNum: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    color: '#8b6914', marginBottom: '4px', textAlign: 'right',
  },
  xpTrack: {
    height: '10px',
    background: '#c4a96a',
    border: '2px solid #3d2b1f',
    boxShadow: 'inset 2px 2px 2px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 50%, #8b6914 100%)',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)',
    transition: 'width 0.8s ease',
  },
  zones: { fontSize: '14px', flexShrink: 0 },
};

export default Leaderboard;