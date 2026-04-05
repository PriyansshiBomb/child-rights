import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getZones, updateZone } from '../api/gameAPI';
import axios from 'axios';
import '../App.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const { token, logout } = useAuth();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalPlays: 0 });

  useEffect(() => {
    loadZones();
    loadStats();
  }, []);

  const loadZones = async () => {
    try {
      const data = await getZones(token);
      setZones(data.zones);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      // Stats endpoint optional
    }
  };

  const selectZone = (zone) => {
    setSelectedZone(zone);
    setEditData({ ...zone });
    setEditMode(false);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateZone(token, selectedZone._id, editData);
      setSaved(true);
      setEditMode(false);
      loadZones();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (qIndex, field, value) => {
    const newQuestions = [...editData.questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    setEditData({ ...editData, questions: newQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const newQuestions = [...editData.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[optIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setEditData({ ...editData, questions: newQuestions });
  };

  const rightColors = {
    education: '#4a90d9', food: '#5cb85c',
    safety: '#e67e22', health: '#e74c8a', play: '#9b59b6'
  };
  const rightIcons = { education: '📚', food: '🥗', safety: '🛡️', health: '❤️', play: '🎮' };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.titleDiamond}>◆</span>
          <h1 style={styles.title}>⚙️ Admin Panel</h1>
          <span style={styles.titleDiamond}>◆</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.adminBadge}>ADMIN</span>
          <button style={styles.logoutBtn} onClick={logout}>Exit ✕</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total Zones', value: zones.length, icon: '🗺️' },
            { label: 'Active Zones', value: zones.filter(z => z.isActive).length, icon: '✅' },
            { label: 'Total Questions', value: zones.reduce((acc, z) => acc + (z.questions?.length || 0), 0), icon: '❓' },
            { label: 'Platform', value: 'Live', icon: '🚀' },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: '28px' }}>{s.icon}</div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.mainGrid}>
          {/* Zone list */}
          <div style={styles.zoneListPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelHeaderDiamond}>◆</span>
              <span>Rights Zones</span>
              <span style={styles.panelHeaderDiamond}>◆</span>
            </div>
            <div style={styles.zoneListInner}>
              {zones.map(zone => (
                <div key={zone._id}
                  style={{ ...styles.zoneItem, ...(selectedZone?._id === zone._id ? styles.zoneItemActive : {}) }}
                  onClick={() => selectZone(zone)}>
                  <span style={{ fontSize: '24px' }}>{rightIcons[zone.right]}</span>
                  <div style={styles.zoneInfo}>
                    <div style={{
                      color: rightColors[zone.right], fontWeight: 'bold', fontSize: '18px',
                    }}>{zone.name}</div>
                    <div style={styles.zoneSubInfo}>{zone.questions?.length || 0} questions • {zone.xpReward} XP</div>
                  </div>
                  <div style={{
                    ...styles.activeDot,
                    background: zone.isActive
                      ? 'linear-gradient(180deg, #5cb85c, #2d5a27)'
                      : 'linear-gradient(180deg, #c44, #822)',
                    boxShadow: zone.isActive
                      ? '0 0 6px rgba(92,184,92,0.5)'
                      : '0 0 6px rgba(204,68,68,0.5)',
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Zone editor */}
          <div style={styles.editorPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelHeaderDiamond}>◆</span>
              <span>{selectedZone ? `${rightIcons[selectedZone.right]} ${selectedZone.name}` : 'Zone Editor'}</span>
              <span style={styles.panelHeaderDiamond}>◆</span>
            </div>
            <div style={styles.editorInner}>
              {!selectedZone ? (
                <div style={styles.selectPrompt}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
                  <p style={{ fontSize: '20px', color: '#7a6542' }}>Select a zone to edit</p>
                </div>
              ) : (
                <>
                  {/* Editor actions */}
                  <div style={styles.editorActions}>
                    {saved && <span style={styles.savedMsg}>✅ Saved!</span>}
                    {!editMode
                      ? <button style={styles.editBtn} onClick={() => setEditMode(true)}>✏️ Edit</button>
                      : <>
                          <button style={styles.cancelBtn} onClick={() => { setEditMode(false); setEditData({ ...selectedZone }); }}>Cancel</button>
                          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? '⏳...' : '💾 Save'}</button>
                        </>
                    }
                  </div>

                  {/* Zone settings */}
                  <div style={styles.settingsGrid}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Zone Name</label>
                      <input style={styles.input} value={editData.name || ''} disabled={!editMode}
                        onChange={e => setEditData({ ...editData, name: e.target.value })} />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>XP Reward</label>
                      <input style={styles.input} type="number" value={editData.xpReward || 50} disabled={!editMode}
                        onChange={e => setEditData({ ...editData, xpReward: Number(e.target.value) })} />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Description</label>
                      <input style={styles.input} value={editData.description || ''} disabled={!editMode}
                        onChange={e => setEditData({ ...editData, description: e.target.value })} />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Active</label>
                      <select style={styles.select} value={editData.isActive} disabled={!editMode}
                        onChange={e => setEditData({ ...editData, isActive: e.target.value === 'true' })}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={styles.divider}>
                    <span style={styles.dividerDiamond}>◆</span>
                  </div>

                  {/* Questions editor */}
                  <div style={styles.questionsTitle}>Quiz Questions</div>
                  {editData.questions?.map((q, qIndex) => (
                    <div key={qIndex} style={styles.questionCard}>
                      <div style={styles.questionNum}>Question {qIndex + 1}</div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Question Text</label>
                        <input style={styles.input} value={q.question || ''} disabled={!editMode}
                          onChange={e => updateQuestion(qIndex, 'question', e.target.value)} />
                      </div>
                      <div style={styles.optionsGrid}>
                        {q.options?.map((opt, optIndex) => (
                          <div key={optIndex} style={styles.optionRow}>
                            <span style={{
                              ...styles.optionLetter,
                              background: optIndex === q.correctAnswer
                                ? 'linear-gradient(180deg, #5cb85c, #2d5a27)'
                                : 'linear-gradient(180deg, #d4bc82, #c9b078)',
                              color: optIndex === q.correctAnswer ? '#fff' : '#3d2b1f',
                            }}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <input style={{ ...styles.input, flex: 1 }} value={opt || ''} disabled={!editMode}
                              onChange={e => updateOption(qIndex, optIndex, e.target.value)} />
                          </div>
                        ))}
                      </div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Correct Answer (0=A, 1=B, 2=C, 3=D)</label>
                        <input style={styles.input} type="number" min="0" max="3"
                          value={q.correctAnswer} disabled={!editMode}
                          onChange={e => updateQuestion(qIndex, 'correctAnswer', Number(e.target.value))} />
                      </div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Explanation (shown after answer)</label>
                        <input style={styles.input} value={q.explanation || ''} disabled={!editMode}
                          onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
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
  adminBadge: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
    padding: '5px 12px',
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    border: '2px solid #8b6914', color: '#3d2b1f',
    boxShadow: '2px 2px 0 #2a1a0e',
    letterSpacing: '1px',
  },
  logoutBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 14px',
    background: 'linear-gradient(180deg, #c44, #922)',
    border: '2px solid #611', color: '#fdd',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  content: {
    maxWidth: '1100px', margin: '0 auto', padding: '20px 20px 80px',
    position: 'relative', zIndex: 2,
  },

  /* Stats */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px',
  },
  statCard: {
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3)',
    border: '3px solid #3d2b1f', padding: '16px', textAlign: 'center',
    boxShadow: '3px 3px 0 #2a1a0e, inset 1px 1px 0 rgba(255,255,255,0.3)',
    animation: 'rpgFadeIn 0.4s ease-out',
  },
  statValue: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
    color: '#8b6914', margin: '6px 0',
  },
  statLabel: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '6px',
    color: '#7a6542', textTransform: 'uppercase',
  },

  /* Main grid */
  mainGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' },

  /* Zone list panel */
  zoneListPanel: {
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3, #c4a96a)',
    border: '4px solid #3d2b1f',
    boxShadow: '4px 4px 0px #2a1a0e, inset 2px 2px 0 rgba(255,255,255,0.3)',
    alignSelf: 'start',
  },
  panelHeader: {
    background: 'linear-gradient(180deg, #3d2b1f, #5c3d28, #3d2b1f)',
    padding: '8px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    borderBottom: '3px solid #2a1a0e',
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    color: '#f5e6c8', textShadow: '1px 1px 0 #2a1a0e',
  },
  panelHeaderDiamond: { color: '#c19a49', fontSize: '10px' },
  zoneListInner: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  zoneItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(193,154,73,0.15)', border: '2px solid rgba(61,43,31,0.3)',
    padding: '10px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  zoneItemActive: {
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    border: '2px solid #8b6914',
    boxShadow: '0 0 10px rgba(193,154,73,0.4)',
  },
  zoneInfo: { flex: 1, minWidth: 0 },
  zoneSubInfo: { color: '#7a6542', fontSize: '16px', marginTop: '2px' },
  activeDot: {
    width: '12px', height: '12px',
    border: '2px solid #3d2b1f', flexShrink: 0,
  },

  /* Editor panel */
  editorPanel: {
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3, #c4a96a)',
    border: '4px solid #3d2b1f',
    boxShadow: '4px 4px 0px #2a1a0e, inset 2px 2px 0 rgba(255,255,255,0.3)',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
  },
  editorInner: { padding: '16px', overflowY: 'auto', flex: 1 },
  selectPrompt: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '200px',
  },
  editorActions: {
    display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  savedMsg: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#2d5a27',
  },
  editBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 16px',
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3)',
    border: '2px solid #3d2b1f', color: '#3d2b1f',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  cancelBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 16px',
    background: 'linear-gradient(180deg, #d4bc82, #c9b078)',
    border: '2px solid #3d2b1f', color: '#7a6542',
    cursor: 'pointer', boxShadow: '2px 2px 0 #2a1a0e',
  },
  saveBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    padding: '8px 18px',
    background: 'linear-gradient(180deg, #e8c252, #c19a49, #8b6914)',
    border: '3px solid #8b6914', color: '#3d2b1f',
    cursor: 'pointer', boxShadow: '2px 2px 0 #3d2b1f',
  },

  /* Settings */
  settingsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' },
  label: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '6px',
    color: '#7a6542', textTransform: 'uppercase', letterSpacing: '1px',
  },
  input: {
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #d4bc82, #c9b078)',
    border: '2px solid #3d2b1f', color: '#3d2b1f', fontSize: '18px',
    fontFamily: "'VT323', monospace",
    boxShadow: 'inset 2px 2px 3px rgba(0,0,0,0.2)',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  select: {
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #d4bc82, #c9b078)',
    border: '2px solid #3d2b1f', color: '#3d2b1f', fontSize: '18px',
    fontFamily: "'VT323', monospace",
    boxShadow: 'inset 2px 2px 3px rgba(0,0,0,0.2)',
    outline: 'none', cursor: 'pointer',
  },
  divider: {
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #3d2b1f, transparent)',
    margin: '12px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  dividerDiamond: {
    background: '#e8d5a3', padding: '0 10px',
    color: '#c19a49', fontSize: '10px', position: 'relative', top: '-1px',
  },
  questionsTitle: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
    color: '#8b6914', margin: '8px 0 12px',
    textTransform: 'uppercase', letterSpacing: '1px',
  },
  questionCard: {
    background: 'rgba(193,154,73,0.15)', border: '2px solid rgba(61,43,31,0.3)',
    padding: '14px', marginBottom: '12px',
  },
  questionNum: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
    color: '#c19a49', marginBottom: '10px',
  },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  optionLetter: {
    width: '28px', height: '28px',
    border: '2px solid #3d2b1f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
    fontWeight: 'bold', flexShrink: 0,
    boxShadow: '1px 1px 0 rgba(0,0,0,0.3)',
  },

  /* Ground */
};

export default AdminPanel;