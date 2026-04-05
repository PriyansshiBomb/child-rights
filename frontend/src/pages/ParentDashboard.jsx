import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getChildProgress } from '../api/gameAPI';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ParentDashboard = () => {
  const { token, user, logout } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [searchError, setSearchError] = useState('');

  const searchChild = async () => {
    setSearchError('');
    setLoading(true);
    try {
      // Search by email
      const res = await axios.get(`${BASE_URL}/auth/find?email=${childEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const child = res.data.user;
      if (child.role !== 'child') {
        setSearchError('That account is not a child account');
        return;
      }
      setChildren(prev => {
        if (prev.find(c => c.id === child.id)) return prev;
        return [...prev, child];
      });
      loadChildProgress(child.id);
    } catch (err) {
      setSearchError('Child not found with that email');
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async (childId) => {
    setLoading(true);
    try {
      const data = await getChildProgress(token, childId);
      setProgress(data.progress);
      setSelectedChild(childId);
    } catch (err) {
      console.error('Failed to load child progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const rightColors = {
    education: '#4FC3F7', food: '#81C784',
    safety: '#EF5350', health: '#AB47BC', play: '#FFB74D'
  };
  const rightIcons = {
    education: '📚', food: '🥗', safety: '🛡️', health: '❤️', play: '🎮'
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👨‍👩‍👧 Parent Dashboard</h1>
        <div style={styles.headerRight}>
          <span style={styles.parentName}>Welcome, {user?.username}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Search child */}
        <div style={styles.searchCard}>
          <h2 style={styles.sectionTitle}>🔍 Find Your Child's Account</h2>
          <p style={styles.hint}>Enter your child's registered email to view their progress</p>
          <div style={styles.searchRow}>
            <input
              style={styles.input}
              placeholder="Child's email address"
              value={childEmail}
              onChange={e => setChildEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchChild()}
            />
            <button style={styles.searchBtn} onClick={searchChild} disabled={loading}>
              {loading ? '...' : 'View Progress'}
            </button>
          </div>
          {searchError && <p style={styles.error}>{searchError}</p>}
        </div>

        {/* Child list tabs */}
        {children.length > 0 && (
          <div style={styles.childTabs}>
            {children.map(child => (
              <button key={child.id}
                style={{ ...styles.childTab, ...(selectedChild === child.id ? styles.childTabActive : {}) }}
                onClick={() => loadChildProgress(child.id)}>
                🧒 {child.username}
              </button>
            ))}
          </div>
        )}

        {/* Progress display */}
        {progress && (
          <div style={styles.progressSection}>
            {/* Stats row */}
            <div style={styles.statsRow}>
              {[
                { label: 'Total XP', value: progress.xp || 0, icon: '⭐' },
                { label: 'Level', value: progress.level || 1, icon: '🎯' },
                { label: 'Zones Done', value: `${progress.totalZonesCompleted || 0}/5`, icon: '🗺️' },
                { label: 'Badges', value: progress.badgesEarned?.length || 0, icon: '🏅' },
              ].map(stat => (
                <div key={stat.label} style={styles.statCard}>
                  <div style={styles.statIcon}>{stat.icon}</div>
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* XP Progress bar */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📈 Learning Progress</h3>
              <div style={styles.xpBarWrap}>
                <div style={styles.xpBarTrack}>
                  <div style={{
                    ...styles.xpBarFill,
                    width: `${Math.min(100, ((progress.xp || 0) % 100))}%`
                  }} />
                </div>
                <span style={styles.xpBarLabel}>{progress.xp || 0} XP • Level {progress.level || 1}</span>
              </div>
            </div>

            {/* Zones completed */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🗺️ Rights Zones Explored</h3>
              {progress.zonesCompleted?.length === 0 ? (
                <p style={styles.emptyText}>No zones completed yet — encourage them to explore!</p>
              ) : (
                <div style={styles.zoneList}>
                  {progress.zonesCompleted?.map((z, i) => (
                    <div key={i} style={styles.zoneItem}>
                      <span style={styles.zoneIcon}>
                        {rightIcons[z.zoneId?.right] || '🌍'}
                      </span>
                      <div style={styles.zoneInfo}>
                        <div style={{ color: rightColors[z.zoneId?.right] || '#FFD700', fontWeight: 'bold' }}>
                          {z.zoneId?.name || 'Unknown Zone'}
                        </div>
                        <div style={styles.zoneSubInfo}>
                          Score: {z.score}% • {new Date(z.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.zoneBadge}>✅</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Badges earned */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🏅 Badges Earned</h3>
              {progress.badgesEarned?.length === 0 ? (
                <p style={styles.emptyText}>No badges yet — zones unlock badges!</p>
              ) : (
                <div style={styles.badgeGrid}>
                  {progress.badgesEarned?.map((b, i) => (
                    <div key={i} style={styles.badgeItem}>
                      <div style={styles.badgeIcon}>{b.badgeId?.icon || '🏅'}</div>
                      <div style={styles.badgeName}>{b.badgeId?.name || 'Badge'}</div>
                      <div style={styles.badgeDate}>{new Date(b.earnedAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', color: '#fff', overflow: 'auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,215,0,0.2)', background: 'rgba(0,0,0,0.4)' },
  title: { color: '#FFD700', fontSize: '24px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  parentName: { color: '#aaa', fontSize: '14px' },
  logoutBtn: { background: 'rgba(255,82,82,0.2)', border: '1px solid #ff5252', color: '#ff5252', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '800px', margin: '0 auto', padding: '30px 20px' },
  searchCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
  sectionTitle: { color: '#FFD700', fontSize: '18px', marginBottom: '8px' },
  hint: { color: '#aaa', fontSize: '13px', marginBottom: '16px' },
  searchRow: { display: 'flex', gap: '12px' },
  input: { flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '15px', outline: 'none' },
  searchBtn: { padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#1a1a2e', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  error: { color: '#ff5252', fontSize: '13px', marginTop: '8px' },
  childTabs: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  childTab: { padding: '8px 20px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.3)', background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '14px' },
  childTabActive: { background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid #FFD700' },
  progressSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '14px', padding: '20px', textAlign: 'center' },
  statIcon: { fontSize: '28px', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#FFD700' },
  statLabel: { color: '#aaa', fontSize: '12px', marginTop: '4px' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' },
  cardTitle: { color: '#FFD700', fontSize: '16px', marginBottom: '16px' },
  xpBarWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  xpBarTrack: { height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' },
  xpBarFill: { height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '6px', transition: 'width 1s ease' },
  xpBarLabel: { color: '#aaa', fontSize: '13px' },
  zoneList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  zoneItem: { display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' },
  zoneIcon: { fontSize: '28px' },
  zoneInfo: { flex: 1 },
  zoneSubInfo: { color: '#aaa', fontSize: '12px', marginTop: '3px' },
  zoneBadge: { fontSize: '20px' },
  emptyText: { color: '#aaa', fontSize: '14px' },
  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' },
  badgeItem: { background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  badgeIcon: { fontSize: '32px', marginBottom: '8px' },
  badgeName: { fontSize: '12px', fontWeight: 'bold', color: '#FFD700' },
  badgeDate: { fontSize: '11px', color: '#aaa', marginTop: '4px' }
};

export default ParentDashboard;