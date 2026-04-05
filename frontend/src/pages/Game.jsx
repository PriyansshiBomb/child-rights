import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { useAuth } from '../hooks/useAuth';
import { getZones, getMyProgress, saveProgress, getLeaderboard } from '../api/gameAPI';
import { useNavigate } from 'react-router-dom';

/* ── Palette ───────────────────────────────────────────────────── */
const THEME = {
  bg:          '#0f0a1e',
  bgMid:       '#130d25',
  bgCard:      'rgba(255,255,255,0.04)',
  border:      'rgba(139,92,246,0.25)',
  borderBright:'rgba(139,92,246,0.6)',
  gold:        '#fbbf24',
  goldGlow:    'rgba(251,191,36,0.35)',
  purple:      '#8b5cf6',
  purpleLight: '#a78bfa',
  teal:        '#2dd4bf',
  tealGlow:    'rgba(45,212,191,0.3)',
  text:        '#e2e8f0',
  textMuted:   '#64748b',
  textDim:     '#94a3b8',
  green:       '#34d399',
  red:         '#f87171',
};

const RIGHT_COLORS = {
  education: '#38bdf8',
  food:      '#4ade80',
  safety:    '#fb923c',
  health:    '#f472b6',
  play:      '#a78bfa',
};
const RIGHT_ICONS = {
  education: '📚',
  food:      '🥗',
  safety:    '🛡️',
  health:    '❤️',
  play:      '🎮',
};
const ALL_RIGHTS = ['education', 'food', 'safety', 'health', 'play'];

/* ── Small reusable components ─────────────────────────────────── */
const Divider = () => (
  <div style={{ height: 1, background: THEME.border, margin: '12px 0' }} />
);

const SectionLabel = ({ children, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: THEME.purpleLight,
    marginBottom: 10,
  }}>
    {icon && <span>{icon}</span>}
    {children}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const Game = () => {
  const canvasRef  = useRef(null);
  const engineRef  = useRef(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [zones,        setZones]        = useState([]);
  const [progress,     setProgress]     = useState(null);
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [activeZone,   setActiveZone]   = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizIndex,    setQuizIndex]    = useState(0);
  const [quizScore,    setQuizScore]    = useState(0);
  const [quizDone,     setQuizDone]     = useState(false);
  const [feedback,     setFeedback]     = useState(null);
  const [badgePopup,   setBadgePopup]   = useState(null);
  const [loading,      setLoading]      = useState(true);

  /* ── Load data ──────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const [z, p, lb] = await Promise.all([
          getZones(token), getMyProgress(token), getLeaderboard(token),
        ]);
        setZones(z.zones);
        setProgress(p.progress);
        setLeaderboard(lb.leaderboard || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ── Init engine ────────────────────────────────────────────── */
  useEffect(() => {
    if (loading || zones.length === 0 || !canvasRef.current) return;
    const completedIds = progress?.zonesCompleted?.map(z => z.zoneId?._id || z.zoneId) || [];
    const engine = new GameEngine(
      canvasRef.current, zones, completedIds,
      handleZoneEnter, progress?.playerPosition,
    );
    engineRef.current = engine;
    engine.start();
    return () => engine.stop();
  }, [loading, zones]);

  /* ── Zone enter ─────────────────────────────────────────────── */
  const handleZoneEnter = useCallback((zone) => {
    if (!zone.questions?.length) return;
    setActiveZone(zone);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizDone(false);
    setFeedback(null);
    setQuizQuestion(zone.questions[0]);
    if (engineRef.current) engineRef.current.running = false;
  }, []);

  /* ── Answer ─────────────────────────────────────────────────── */
  const handleAnswer = async (optionIndex) => {
    const correct   = optionIndex === quizQuestion.correctAnswer;
    const newScore  = correct ? quizScore + 1 : quizScore;
    if (correct) setQuizScore(newScore);
    setFeedback({ correct, explanation: quizQuestion.explanation });

    setTimeout(async () => {
      const nextIndex = quizIndex + 1;
      if (nextIndex < activeZone.questions.length) {
        setQuizIndex(nextIndex);
        setQuizQuestion(activeZone.questions[nextIndex]);
        setFeedback(null);
      } else {
        setQuizDone(true);
        const scorePercent = Math.round((newScore / activeZone.questions.length) * 100);
        try {
          const result = await saveProgress(token, {
            xpEarned: activeZone.xpReward,
            zoneId:   activeZone._id,
            quizScore: scorePercent,
            playerPosition: engineRef.current?.getPlayerPosition(),
          });
          setProgress(prev => ({
            ...prev,
            xp:                  result.progress.xp,
            level:               result.progress.level,
            totalZonesCompleted: result.progress.totalZonesCompleted,
          }));
          if (engineRef.current) {
            engineRef.current.updateCompletedZones([
              ...(engineRef.current.completedZoneIds), activeZone._id,
            ]);
          }
          if (result.unlockedBadges?.length) setBadgePopup(result.unlockedBadges[0]);
          const lbData = await getLeaderboard(token);
          setLeaderboard(lbData.leaderboard || []);
        } catch (e) {
          console.error(e);
        }
      }
    }, 1600);
  };

  /* ── Close quiz ─────────────────────────────────────────────── */
  const closeQuiz = () => {
    setActiveZone(null);
    setQuizQuestion(null);
    setQuizDone(false);
    setFeedback(null);
    if (engineRef.current) {
      engineRef.current.fitCanvas();
      engineRef.current.running = true;
      requestAnimationFrame(() => engineRef.current.loop());
    }
  };

  /* ── Loading screen ─────────────────────────────────────────── */
  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: THEME.bg, flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 64 }}>🌍</div>
      <div style={{ color: THEME.gold, fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
        Loading Rights Quest…
      </div>
      <div style={{ color: THEME.textMuted, fontSize: 13 }}>Preparing your adventure</div>
    </div>
  );

  /* ── Derived state ──────────────────────────────────────────── */
  const xp             = progress?.xp    || 0;
  const level          = progress?.level || 1;
  const xpInLevel      = xp % 100;
  const completedZones = progress?.zonesCompleted || [];
  const badges         = progress?.badgesEarned   || [];
  const zoneColor      = RIGHT_COLORS[activeZone?.right] || THEME.gold;

  /* ════════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════════ */
  return (
    <div style={S.wrapper}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header style={S.topBar}>

        {/* Profile */}
        <div style={S.profileBox}>
          <div style={S.avatar}>{user?.username?.charAt(0).toUpperCase()}</div>
          <div>
            <div style={S.username}>{user?.username}</div>
            <div style={S.roleTag}>Rights Explorer</div>
          </div>
          <div style={S.levelPill}>Lv {level}</div>
        </div>

        {/* XP bar + zone dots */}
        <div style={S.xpBox}>
          <div style={S.xpRow}>
            <span style={S.xpLabel}>✦ {xp.toLocaleString()} XP</span>
            <span style={S.xpNext}>{xpInLevel} / 100 to next level</span>
          </div>
          <div style={S.xpTrack}>
            <div style={{ ...S.xpFill, width: `${xpInLevel}%` }} />
            <div style={{ ...S.xpSheen, width: `${xpInLevel}%` }} />
          </div>
          <div style={S.dotRow}>
            {ALL_RIGHTS.map(r => {
              const done = completedZones.some(z => z.zoneId?.right === r);
              return (
                <div key={r} title={r} style={{
                  ...S.dot,
                  background: done ? RIGHT_COLORS[r] : 'rgba(255,255,255,0.08)',
                  boxShadow:  done ? `0 0 10px ${RIGHT_COLORS[r]}` : 'none',
                  border: `2px solid ${done ? RIGHT_COLORS[r] : 'rgba(255,255,255,0.12)'}`,
                }}>
                  <span style={{ fontSize: 12 }}>{RIGHT_ICONS[r]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats + exit */}
        <div style={S.statsBox}>
          <div style={S.chip}>🏅 {badges.length} Badges</div>
          <div style={S.chip}>🗺️ {progress?.totalZonesCompleted || 0} / 5</div>
          <button style={S.exitBtn} onClick={logout}>← Exit</button>
        </div>
      </header>

      {/* ── MAIN ROW ────────────────────────────────────────── */}
      <div style={S.mainRow}>

        {/* LEFT PANEL */}
        <aside style={S.panel}>
          <SectionLabel icon="🏆">Top Players</SectionLabel>
          {leaderboard.length === 0
            ? <div style={S.empty}>No players yet!<br />Be the first 🌟</div>
            : leaderboard.slice(0, 8).map((e, i) => (
              <div key={i} style={{
                ...S.lbRow,
                ...(e.username === user?.username ? S.lbRowMe : {}),
              }}>
                <span style={S.rank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div style={{ ...S.lbAvatar, background: `hsl(${i * 47}, 65%, 52%)` }}>
                  {e.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.lbName}>{e.username}</div>
                  <div style={S.lbSub}>{e.xp} XP · Lv {e.level}</div>
                </div>
              </div>
            ))
          }
        </aside>

        {/* ── CANVAS ──────────────────────────────────────── */}
        <div style={S.canvasWrap}>
          <canvas ref={canvasRef} style={S.canvas} />
          <div style={S.hint}>
            WASD / Arrow Keys to move &nbsp;•&nbsp; Walk into glowing zones to learn your rights
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside style={S.panel}>
          <SectionLabel icon="🏅">My Badges</SectionLabel>
          {badges.length === 0
            ? <div style={S.empty}>Complete zones<br />to earn badges 🎯</div>
            : (
              <div style={S.badgeGrid}>
                {badges.map((b, i) => (
                  <div key={i} style={S.badgeCard}>
                    <div style={{ fontSize: 26 }}>{b.badgeId?.icon || '🏅'}</div>
                    <div style={S.badgeName}>{b.badgeId?.name?.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            )
          }

          <Divider />
          <SectionLabel icon="🗺️">Zone Status</SectionLabel>

          {ALL_RIGHTS.map(right => {
            const zone = zones.find(z => z.right === right);
            const done = completedZones.some(z => z.zoneId?.right === right);
            const col  = RIGHT_COLORS[right];
            return (
              <div key={right} style={S.zoneRow}>
                <span style={{ fontSize: 18 }}>{RIGHT_ICONS[right]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: done ? col : THEME.textMuted, fontWeight: done ? 700 : 400 }}>
                    {zone?.name || right}
                  </div>
                  <div style={S.zoneBar}>
                    <div style={{ height: '100%', width: done ? '100%' : '0%', background: col, borderRadius: 2, transition: 'width .8s ease' }} />
                  </div>
                </div>
                <span style={{ fontSize: 14 }}>{done ? '✅' : '🔒'}</span>
              </div>
            );
          })}
        </aside>
      </div>

      {/* ── QUIZ MODAL ──────────────────────────────────────── */}
      {quizQuestion && !quizDone && (
        <div style={S.overlay}>
          <div style={S.modal}>
            {/* Modal header */}
            <div style={S.modalHead}>
              <span style={{ fontSize: 48 }}>{RIGHT_ICONS[activeZone?.right]}</span>
              <div>
                <h2 style={{ color: zoneColor, margin: 0, fontSize: 22, fontFamily: 'Georgia, serif' }}>
                  {activeZone?.name}
                </h2>
                <p style={{ color: THEME.textMuted, margin: '4px 0 0', fontSize: 13 }}>
                  {activeZone?.description}
                </p>
              </div>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {activeZone?.questions.map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', transition: 'background .3s',
                  background: i < quizIndex ? THEME.green : i === quizIndex ? THEME.gold : 'rgba(255,255,255,0.12)',
                }} />
              ))}
            </div>

            {/* Question */}
            <div style={S.questionBox}>
              <p style={{ color: THEME.text, fontSize: 18, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                {quizQuestion.question}
              </p>
            </div>

            {/* Options / Feedback */}
            {!feedback ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizQuestion.options.map((opt, i) => (
                  <button key={i} style={S.optionBtn} onClick={() => handleAnswer(i)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; e.currentTarget.style.borderColor = THEME.purple; }}
                    onMouseLeave={e => { e.currentTarget.style.background = THEME.bgCard; e.currentTarget.style.borderColor = THEME.border; }}
                  >
                    <span style={S.optLetter}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ color: THEME.text }}>{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{
                ...S.feedbackBox,
                borderColor:  feedback.correct ? THEME.green  : THEME.red,
                background:   feedback.correct ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
              }}>
                <div style={{ fontSize: 40 }}>{feedback.correct ? '✅' : '❌'}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: feedback.correct ? THEME.green : THEME.red, margin: '10px 0 6px' }}>
                  {feedback.correct ? 'Correct!' : 'Not quite!'}
                </div>
                <p style={{ color: THEME.textDim, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {feedback.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUIZ DONE ───────────────────────────────────────── */}
      {quizDone && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
            <h2 style={{ color: THEME.gold, fontSize: 30, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
              Zone Complete!
            </h2>
            <p style={{ color: THEME.textDim, fontSize: 15, marginBottom: 20 }}>
              You answered {quizScore} of {activeZone?.questions.length} correctly
            </p>
            <div style={S.xpReward}>
              <span style={{ fontSize: 28 }}>⭐</span>
              <span style={{ fontSize: 28, color: THEME.gold, fontWeight: 800 }}>
                +{activeZone?.xpReward} XP
              </span>
            </div>
            {badgePopup && (
              <div style={S.badgeUnlock}>
                <span style={{ fontSize: 36 }}>{badgePopup.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: THEME.gold, fontWeight: 700, fontSize: 14 }}>🎊 Badge Unlocked!</div>
                  <div style={{ color: THEME.textDim, fontSize: 13, marginTop: 3 }}>{badgePopup.name}</div>
                </div>
              </div>
            )}
            <button style={S.continueBtn} onClick={() => { setBadgePopup(null); closeQuiz(); }}>
              Continue Exploring →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */
const S = {
  wrapper: {
    display: 'flex', flexDirection: 'column',
    width: '100vw', height: '100vh',
    background: THEME.bg, overflow: 'hidden', color: THEME.text,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  /* Top bar */
  topBar: {
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '8px 20px', flexShrink: 0,
    background: `linear-gradient(90deg, #110c22 0%, ${THEME.bgMid} 100%)`,
    borderBottom: `1px solid ${THEME.border}`,
    boxShadow: '0 1px 24px rgba(0,0,0,0.6)',
  },
  profileBox: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 210 },
  avatar: {
    width: 42, height: 42, borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0,
    boxShadow: '0 0 14px rgba(139,92,246,0.55)',
  },
  username: { fontWeight: 700, fontSize: 15, color: THEME.purpleLight },
  roleTag:  { fontSize: 10, color: THEME.textMuted, marginTop: 2, letterSpacing: '0.06em' },
  levelPill: {
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    color: '#fff', padding: '3px 10px', borderRadius: 20,
    fontWeight: 700, fontSize: 12,
    boxShadow: '0 0 10px rgba(139,92,246,0.45)',
  },

  xpBox: { flex: 1, maxWidth: 500 },
  xpRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 },
  xpLabel: { color: THEME.gold, fontWeight: 700, fontSize: 14 },
  xpNext:  { color: THEME.textMuted, fontSize: 12 },
  xpTrack: {
    height: 10, borderRadius: 5, overflow: 'hidden', position: 'relative',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid rgba(139,92,246,0.2)`,
  },
  xpFill: {
    position: 'absolute', height: '100%', borderRadius: 5,
    background: 'linear-gradient(90deg, #8b5cf6, #2dd4bf)',
    transition: 'width .7s ease',
  },
  xpSheen: {
    position: 'absolute', height: '100%', borderRadius: 5,
    background: 'rgba(255,255,255,0.15)', filter: 'blur(4px)',
    transition: 'width .7s ease',
  },
  dotRow: { display: 'flex', gap: 8, marginTop: 7, justifyContent: 'center' },
  dot: {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .3s',
  },

  statsBox: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 210, justifyContent: 'flex-end' },
  chip: {
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${THEME.border}`,
    padding: '5px 12px', borderRadius: 20, fontSize: 12, color: THEME.textDim,
  },
  exitBtn: {
    background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)',
    color: '#f87171', padding: '6px 14px', borderRadius: 8,
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },

  /* Main row */
  mainRow: { display: 'flex', flex: 1, minHeight: 0 },

  /* Side panels */
  panel: {
    width: 200, flexShrink: 0,
    background: `linear-gradient(180deg, #0f0a1e 0%, #110c22 100%)`,
    borderRight: `1px solid ${THEME.border}`,
    padding: '14px 12px', overflowY: 'auto',
  },

  empty: { color: THEME.textMuted, fontSize: 12, textAlign: 'center', padding: '18px 0', lineHeight: 1.9 },

  lbRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
    borderRadius: 10, marginBottom: 5,
    background: THEME.bgCard, border: `1px solid rgba(255,255,255,0.04)`,
  },
  lbRowMe: {
    background: 'rgba(139,92,246,0.12)',
    border: `1px solid rgba(139,92,246,0.4)`,
    boxShadow: '0 0 10px rgba(139,92,246,0.15)',
  },
  rank:    { fontSize: 15, width: 24, textAlign: 'center', flexShrink: 0 },
  lbAvatar:{
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  lbName: { fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  lbSub:  { fontSize: 10, color: THEME.gold, marginTop: 1 },

  badgeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 },
  badgeCard: {
    background: 'rgba(139,92,246,0.08)', border: `1px solid rgba(139,92,246,0.2)`,
    borderRadius: 10, padding: '10px 4px', textAlign: 'center',
  },
  badgeName: { fontSize: 9, color: THEME.purpleLight, marginTop: 4, lineHeight: 1.3 },

  zoneRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
    padding: '7px 6px', background: THEME.bgCard, borderRadius: 8,
  },
  zoneBar: { height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 4, overflow: 'hidden' },

  /* Canvas area — KEY: flex:1 + minWidth:0 fills remaining space */
  canvasWrap: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column',
    background: '#0a0814',
    borderLeft: `1px solid ${THEME.border}`,
    borderRight: `1px solid ${THEME.border}`,
  },
  canvas: {
    display: 'block',
    flex: 1,
    minHeight: 0,
    width: '100%',
    imageRendering: 'pixelated',
  },
  hint: {
    color: 'rgba(255,255,255,0.2)', fontSize: 11,
    textAlign: 'center', padding: '6px 0', flexShrink: 0,
    background: 'rgba(0,0,0,0.35)', letterSpacing: '0.04em',
  },

  /* Overlay / Modal */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(5,3,15,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(6px)',
  },
  modal: {
    background: `linear-gradient(135deg, #130d25 0%, #0f0a1e 100%)`,
    border: `1px solid rgba(139,92,246,0.3)`,
    borderRadius: 20, padding: 28,
    width: '90%', maxWidth: 480,
    boxShadow: '0 0 60px rgba(139,92,246,0.15), 0 30px 60px rgba(0,0,0,0.8)',
  },
  modalHead: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 },
  questionBox: {
    background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`,
    borderRadius: 12, padding: 16, marginBottom: 16,
  },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    borderRadius: 10, border: `1px solid ${THEME.border}`,
    background: THEME.bgCard, cursor: 'pointer', fontSize: 14, textAlign: 'left',
    transition: 'all .15s',
  },
  optLetter: {
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(139,92,246,0.15)', color: THEME.purpleLight,
    fontWeight: 700, fontSize: 13, border: `1px solid rgba(139,92,246,0.3)`,
  },
  feedbackBox: { border: '1px solid', borderRadius: 14, padding: 22, textAlign: 'center' },
  xpReward: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    margin: '16px 0',
    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: 12, padding: 14,
  },
  badgeUnlock: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: 12, padding: 12, margin: '10px 0', textAlign: 'left',
  },
  continueBtn: {
    width: '100%', padding: 14, borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    marginTop: 10, boxShadow: '0 0 20px rgba(139,92,246,0.4)',
    letterSpacing: '0.03em',
  },
};

export default Game;