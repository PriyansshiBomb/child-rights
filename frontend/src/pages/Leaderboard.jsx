import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/gameAPI';
import { useAuth } from '../hooks/useAuth';

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

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/game')}>← Back to Game</button>
        <h1 style={styles.title}>🏆 Leaderboard</h1>
        <button style={styles.logoutBtn} onClick={logout}>Exit</button>
      </div>

      <div style={styles.content}>
        {/* Current user rank card */}
        <div style={styles.myRankCard}>
          <span style={styles.myRankLabel}>Your Adventure</span>
          <span style={styles.myRankName}>🧒 {user?.username}</span>
          <span style={styles.myRankSub}>Keep exploring to climb the ranks!</span>
        </div>

        {/* Leaderboard table */}
        {loading ? (
          <div style={styles.loading}>Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '60px' }}>🌍</div>
            <p>No players yet — be the first on the board!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {leaderboard.map((entry, index) => (
              <div key={entry.userId} style={{
                ...styles.entry,
                ...(index < 3 ? { border: `1px solid ${rankColors[index]}40` } : {}),
                ...(entry.username === user?.username ? styles.myEntry : {})
              }}>
                {/* Rank */}
                <div style={styles.rank}>
                  {index < 3
                    ? <span style={{ fontSize: '28px' }}>{rankEmojis[index]}</span>
                    : <span style={{ ...styles.rankNum, color: rankColors[index] || '#aaa' }}>#{index + 1}</span>
                  }
                </div>

                {/* Avatar + Name */}
                <div style={styles.playerInfo}>
                  <div style={styles.avatar}>
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
                      background: index < 3 ? rankColors[index] : '#4FC3F7'
                    }} />
                  </div>
                </div>

                {/* Zones */}
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
  container: { minHeight: '100vh', background: '#1a1a2e', color: '#fff', overflow: 'auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,215,0,0.2)', background: 'rgba(0,0,0,0.4)' },
  backBtn: { background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  title: { color: '#FFD700', fontSize: '28px' },
  logoutBtn: { background: 'rgba(255,82,82,0.2)', border: '1px solid #ff5252', color: '#ff5252', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '700px', margin: '0 auto', padding: '30px 20px' },
  myRankCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '30px', textAlign: 'center' },
  myRankLabel: { color: '#FFD700', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' },
  myRankName: { fontSize: '24px', fontWeight: 'bold', margin: '8px 0' },
  myRankSub: { color: '#aaa', fontSize: '13px' },
  loading: { textAlign: 'center', color: '#aaa', padding: '40px' },
  empty: { textAlign: 'center', color: '#aaa', padding: '40px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  entry: { display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px' },
  myEntry: { background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)' },
  rank: { width: '40px', textAlign: 'center', flexShrink: 0 },
  rankNum: { fontSize: '20px', fontWeight: 'bold' },
  playerInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1a1a2e', fontSize: '18px', flexShrink: 0 },
  username: { fontWeight: 'bold', fontSize: '16px' },
  youTag: { color: '#FFD700', fontSize: '12px' },
  subInfo: { color: '#aaa', fontSize: '12px', marginTop: '2px' },
  xpSection: { width: '140px', flexShrink: 0 },
  xpNum: { color: '#FFD700', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', textAlign: 'right' },
  xpTrack: { height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' },
  xpFill: { height: '100%', borderRadius: '3px', transition: 'width 0.8s ease' },
  zones: { fontSize: '16px', flexShrink: 0 }
};

export default Leaderboard;