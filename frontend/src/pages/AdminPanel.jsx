import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getZones, updateZone } from '../api/gameAPI';
import axios from 'axios';

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
    education: '#4FC3F7', food: '#81C784',
    safety: '#EF5350', health: '#AB47BC', play: '#FFB74D'
  };
  const rightIcons = { education: '📚', food: '🥗', safety: '🛡️', health: '❤️', play: '🎮' };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ Admin Panel</h1>
        <div style={styles.headerRight}>
          <span style={styles.adminBadge}>ADMIN</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
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
          <div style={styles.zoneList}>
            <h2 style={styles.panelTitle}>Rights Zones</h2>
            {zones.map(zone => (
              <div key={zone._id}
                style={{ ...styles.zoneItem, ...(selectedZone?._id === zone._id ? styles.zoneItemActive : {}) }}
                onClick={() => selectZone(zone)}>
                <span style={{ fontSize: '24px' }}>{rightIcons[zone.right]}</span>
                <div style={styles.zoneInfo}>
                  <div style={{ color: rightColors[zone.right], fontWeight: 'bold', fontSize: '14px' }}>{zone.name}</div>
                  <div style={styles.zoneSubInfo}>{zone.questions?.length || 0} questions • {zone.xpReward} XP</div>
                </div>
                <div style={{ ...styles.activeDot, background: zone.isActive ? '#00E676' : '#ff5252' }} />
              </div>
            ))}
          </div>

          {/* Zone editor */}
          <div style={styles.editor}>
            {!selectedZone ? (
              <div style={styles.selectPrompt}>
                <div style={{ fontSize: '48px' }}>👈</div>
                <p>Select a zone to edit</p>
              </div>
            ) : (
              <>
                <div style={styles.editorHeader}>
                  <h2 style={{ color: rightColors[selectedZone.right], fontSize: '20px' }}>
                    {rightIcons[selectedZone.right]} {selectedZone.name}
                  </h2>
                  <div style={styles.editorActions}>
                    {saved && <span style={styles.savedMsg}>✅ Saved!</span>}
                    {!editMode
                      ? <button style={styles.editBtn} onClick={() => setEditMode(true)}>✏️ Edit</button>
                      : <>
                          <button style={styles.cancelBtn} onClick={() => { setEditMode(false); setEditData({ ...selectedZone }); }}>Cancel</button>
                          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>
                        </>
                    }
                  </div>
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
                    <select style={styles.input} value={editData.isActive} disabled={!editMode}
                      onChange={e => setEditData({ ...editData, isActive: e.target.value === 'true' })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Questions editor */}
                <h3 style={styles.questionsTitle}>Quiz Questions</h3>
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
                            background: optIndex === q.correctAnswer ? '#00E676' : 'rgba(255,255,255,0.1)',
                            color: optIndex === q.correctAnswer ? '#1a1a2e' : '#fff'
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
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', color: '#fff', overflow: 'auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,215,0,0.2)', background: 'rgba(0,0,0,0.4)' },
  title: { color: '#FFD700', fontSize: '24px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  adminBadge: { background: 'rgba(255,215,0,0.2)', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  logoutBtn: { background: 'rgba(255,82,82,0.2)', border: '1px solid #ff5252', color: '#ff5252', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '14px', padding: '20px', textAlign: 'center' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#FFD700', margin: '6px 0' },
  statLabel: { color: '#aaa', fontSize: '12px' },
  mainGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' },
  panelTitle: { color: '#FFD700', fontSize: '16px', marginBottom: '16px' },
  zoneList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  zoneItem: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', cursor: 'pointer' },
  zoneItemActive: { background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.4)' },
  zoneInfo: { flex: 1 },
  zoneSubInfo: { color: '#aaa', fontSize: '12px', marginTop: '2px' },
  activeDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  editor: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', overflowY: 'auto', maxHeight: '80vh' },
  selectPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#aaa' },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  editorActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  savedMsg: { color: '#00E676', fontSize: '14px' },
  editBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.1)', color: '#FFD700', cursor: 'pointer' },
  cancelBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#aaa', cursor: 'pointer' },
  saveBtn: { padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#1a1a2e', fontWeight: 'bold', cursor: 'pointer' },
  settingsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#aaa', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px', outline: 'none', width: '100%' },
  questionsTitle: { color: '#FFD700', fontSize: '15px', margin: '20px 0 14px' },
  questionCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '16px' },
  questionNum: { color: '#FFD700', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  optionLetter: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }
};

export default AdminPanel;