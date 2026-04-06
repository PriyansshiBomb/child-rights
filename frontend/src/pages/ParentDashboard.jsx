import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getChildProgress } from '../api/gameAPI';
import { getParentReport, askParentChat } from '../api/aiAPI';
import axios from 'axios';
import '../App.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ParentDashboard = () => {
  const { token, user, logout } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [searchError, setSearchError] = useState('');
  
  // AI states
  const [aiReport, setAiReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // If using the childID code parent session, pre-populate and hide search
  useEffect(() => {
    if (user?.isParentSession && user?.id) {
      setChildren([{ id: user.id, username: user.username }]);
      loadChildProgress(user.id);
    }
  }, [user?.isParentSession, user?.id]);

  const searchChild = async () => {
    setSearchError('');
    setLoading(true);
    try {
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
    // Reset AI states when switching child
    setAiReport('');
    setChatMessages([]);
    try {
      const data = await getChildProgress(token, childId);
      setProgress(data.progress);
      setSelectedChild(childId);
      
      // Auto-generate AI report
      generateReport(data.progress);
    } catch (err) {
      console.error('Failed to load child progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (progData) => {
    setReportLoading(true);
    try {
      const res = await getParentReport(progData);
      setAiReport(res.report);
    } catch (err) {
      setAiReport('Could not generate AI report at this time.');
    } finally {
      setReportLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    
    try {
      const res = await askParentChat(msg, progress);
      setChatMessages(prev => [...prev, { role: 'ai', text: res.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Oops! I had trouble understanding that.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const rightColors = {
    education: '#4a90d9', food: '#5cb85c',
    safety: '#e67e22', health: '#e74c8a', play: '#9b59b6'
  };
  const rightIcons = {
    education: '📚', food: '🥗', safety: '🛡️', health: '❤️', play: '🎮'
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.titleDiamond}>◆</span>
          <h1 style={styles.title}>👨‍👩‍👧 Parent Dashboard</h1>
          <span style={styles.titleDiamond}>◆</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.parentName}>⚔️ {user?.username}</span>
          <button style={styles.logoutBtn} onClick={logout}>Exit ✕</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Search card (hidden if logged in via specific Child ID) */}
        {!user?.isParentSession && (
          <div style={styles.searchCard}>
            <div style={styles.searchHeader}>
              <span style={styles.searchHeaderDiamond}>◆</span>
              <span style={styles.searchHeaderText}>🔍 Find Your Child's Account</span>
              <span style={styles.searchHeaderDiamond}>◆</span>
            </div>
            <div style={styles.searchInner}>
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
                  {loading ? '⏳' : '🔍 Search'}
                </button>
              </div>
              {searchError && <p style={styles.error}>⚠ {searchError}</p>}
            </div>
          </div>
        )}

        {/* Child tabs */}
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

            {/* AI Insights Card */}
            <div style={{ ...styles.card, border: '4px solid #c19a49' }}>
              <div style={{ ...styles.cardHeader, background: 'linear-gradient(180deg, #5c3d28, #3d2b1f)' }}>
                <span style={styles.cardHeaderDiamond}>◆</span>
                <span style={{ color: '#e8c252' }}>✨ AI Progress Summary & Consult</span>
                <span style={styles.cardHeaderDiamond}>◆</span>
              </div>
              <div style={styles.cardBody}>
                {/* Auto Report */}
                <div style={styles.reportBox}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#8b6914' }}>Weekly Report</h3>
                  {reportLoading ? (
                    <p style={{ color: '#7a6542' }}>Generating insights...</p>
                  ) : (
                    <p style={{ fontSize: '18px', lineHeight: 1.5, margin: 0 }}>{aiReport}</p>
                  )}
                </div>

                <hr style={{ border: 'none', borderBottom: '2px dashed rgba(61,43,31,0.2)', margin: '16px 0' }} />

                {/* Parent Q&A Bot */}
                <div style={styles.qaBox}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#8b6914' }}>Ask the AI Advisor</h3>
                  <div style={styles.messagesBox}>
                    {chatMessages.length === 0 && (
                      <div style={{ color: '#7a6542', fontStyle: 'italic', marginBottom: '8px' }}>
                        Ask me about your child's progress! (e.g. "How are they doing?", "What should we practice?")
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          background: msg.role === 'user' ? '#c19a49' : '#f5e6c8',
                          color: '#3d2b1f',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          maxWidth: '85%',
                          border: '2px solid rgba(61,43,31,0.2)',
                          fontSize: '18px'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && <div style={{ color: '#7a6542', fontStyle: 'italic' }}>AI is typing...</div>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input
                      style={{ ...styles.input, fontSize: '18px' }}
                      placeholder="Ask the AI..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    />
                    <button style={styles.searchBtn} onClick={sendChatMessage}>
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Progress bar */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardHeaderDiamond}>◆</span>
                <span>📈 Learning Progress</span>
                <span style={styles.cardHeaderDiamond}>◆</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.xpBarWrap}>
                  <div style={styles.xpBarTrack}>
                    <div style={{
                      ...styles.xpBarFill,
                      width: `${Math.min(100, ((progress.xp || 0) % 100))}%`
                    }} />
                  </div>
                  <span style={styles.xpBarLabel}>
                    ✦ {progress.xp || 0} XP • Level {progress.level || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Zones completed */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardHeaderDiamond}>◆</span>
                <span>🗺️ Rights Zones Explored</span>
                <span style={styles.cardHeaderDiamond}>◆</span>
              </div>
              <div style={styles.cardBody}>
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
                          <div style={{
                            color: rightColors[z.zoneId?.right] || '#c19a49',
                            fontWeight: 'bold', fontSize: '20px',
                          }}>
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
            </div>

            {/* Badges earned */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardHeaderDiamond}>◆</span>
                <span>🏅 Badges Earned</span>
                <span style={styles.cardHeaderDiamond}>◆</span>
              </div>
              <div style={styles.cardBody}>
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
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    background: 'transparent',
    color: '#3d2b1f', overflow: 'auto',
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
  titleRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  title: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
    color: '#f5e6c8', textShadow: '2px 2px 0 #2a1a0e', margin: 0,
  },
  titleDiamond: { color: '#c19a49', fontSize: '12px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  parentName: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    color: '#c19a49',
  },
  logoutBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 14px',
    background: 'linear-gradient(180deg, #c44, #922)',
    border: '2px solid #611', color: '#fdd',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  content: {
    maxWidth: '850px', margin: '0 auto', padding: '24px 20px 80px',
    position: 'relative', zIndex: 2,
  },

  /* Search card */
  searchCard: {
    background: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a3 50%, #c4a96a 100%)',
    border: '4px solid #3d2b1f',
    boxShadow: '4px 4px 0px #2a1a0e, inset 2px 2px 0 rgba(255,255,255,0.3)',
    marginBottom: '24px',
    animation: 'rpgFadeIn 0.4s ease-out',
  },
  searchHeader: {
    background: 'linear-gradient(180deg, #3d2b1f, #5c3d28, #3d2b1f)',
    padding: '8px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    borderBottom: '3px solid #2a1a0e',
    fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
    color: '#f5e6c8', textShadow: '1px 1px 0 #2a1a0e',
  },
  searchHeaderDiamond: { color: '#c19a49', fontSize: '10px' },
  searchHeaderText: {},
  searchInner: { padding: '16px 20px' },
  hint: { color: '#7a6542', fontSize: '18px', marginBottom: '14px' },
  searchRow: { display: 'flex', gap: '10px' },
  input: {
    flex: 1, padding: '10px 14px',
    background: 'linear-gradient(180deg, #d4bc82, #c9b078)',
    border: '2px solid #3d2b1f', color: '#3d2b1f', fontSize: '20px',
    fontFamily: "'VT323', monospace",
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.25)',
    outline: 'none', boxSizing: 'border-box',
  },
  searchBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(180deg, #e8c252, #c19a49, #8b6914)',
    border: '3px solid #8b6914', color: '#3d2b1f',
    cursor: 'pointer', boxShadow: '2px 2px 0 #3d2b1f',
    whiteSpace: 'nowrap',
  },
  error: { color: '#8b2500', fontSize: '18px', marginTop: '8px' },

  /* Child tabs */
  childTabs: { display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' },
  childTab: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 16px',
    background: 'linear-gradient(180deg, #d4bc82, #c9b078)',
    border: '2px solid #3d2b1f', color: '#7a6542',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  childTabActive: {
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    color: '#3d2b1f', borderColor: '#8b6914',
    boxShadow: '2px 2px 0 #2a1a0e, 0 0 10px rgba(193,154,73,0.4)',
  },

  /* Progress */
  progressSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  statCard: {
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3)',
    border: '3px solid #3d2b1f', padding: '16px', textAlign: 'center',
    boxShadow: '3px 3px 0 #2a1a0e, inset 1px 1px 0 rgba(255,255,255,0.3)',
    animation: 'rpgFadeIn 0.4s ease-out',
  },
  statIcon: { fontSize: '28px', marginBottom: '6px' },
  statValue: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
    color: '#8b6914', margin: '4px 0',
  },
  statLabel: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '6px',
    color: '#7a6542', textTransform: 'uppercase', letterSpacing: '1px',
  },

  /* Cards */
  card: {
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3, #c4a96a)',
    border: '4px solid #3d2b1f',
    boxShadow: '4px 4px 0px #2a1a0e, inset 2px 2px 0 rgba(255,255,255,0.3)',
    animation: 'rpgFadeIn 0.5s ease-out',
  },
  cardHeader: {
    background: 'linear-gradient(180deg, #3d2b1f, #5c3d28, #3d2b1f)',
    padding: '8px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    borderBottom: '3px solid #2a1a0e',
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    color: '#f5e6c8', textShadow: '1px 1px 0 #2a1a0e',
  },
  cardHeaderDiamond: { color: '#c19a49', fontSize: '10px' },
  cardBody: { padding: '16px 20px' },

  /* XP bar */
  xpBarWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  xpBarTrack: {
    height: '16px', background: '#c4a96a',
    border: '2px solid #3d2b1f',
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 50%, #8b6914 100%)',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)',
    transition: 'width 1s ease',
  },
  xpBarLabel: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    color: '#7a6542',
  },

  /* Zones */
  zoneList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  zoneItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'rgba(193,154,73,0.15)', border: '2px solid rgba(61,43,31,0.3)',
    padding: '10px 12px',
  },
  zoneIcon: { fontSize: '28px' },
  zoneInfo: { flex: 1 },
  zoneSubInfo: { color: '#7a6542', fontSize: '16px', marginTop: '2px' },
  zoneBadge: { fontSize: '20px' },
  emptyText: { color: '#7a6542', fontSize: '20px' },

  /* Badges */
  badgeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px',
  },
  badgeItem: {
    background: 'rgba(193,154,73,0.2)', border: '2px solid rgba(61,43,31,0.3)',
    padding: '12px', textAlign: 'center',
  },
  badgeIcon: { fontSize: '32px', marginBottom: '6px' },
  badgeName: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '6px',
    color: '#8b6914',
  },
  badgeDate: { fontSize: '16px', color: '#7a6542', marginTop: '4px' },

  /* AI Components */
  reportBox: {
    background: 'rgba(193,154,73,0.15)',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid rgba(193,154,73,0.4)',
  },
  qaBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  messagesBox: {
    maxHeight: '200px',
    overflowY: 'auto',
    background: 'rgba(255,255,255,0.1)',
    padding: '10px',
    border: '2px solid rgba(61,43,31,0.2)',
    borderRadius: '6px',
    marginBottom: '8px',
  }
};

export default ParentDashboard;