import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { useAuth } from '../hooks/useAuth';
import { getZones, getMyProgress, saveProgress, getLeaderboard } from '../api/gameAPI';
import { useNavigate } from 'react-router-dom';
import '../App.css';

/* ── RPG Palette ──────────────────────────────────────────── */
const THEME = {
  bg:           '#1a3a6a',
  bgMid:        '#2c5f99',
  bgCard:       'rgba(193,154,73,0.15)',
  border:       '#3d2b1f',
  borderBright: '#8b6914',
  gold:         '#c19a49',
  goldGlow:     'rgba(193,154,73,0.5)',
  parchment:    '#e8d5a3',
  parchLight:   '#f5e6c8',
  parchDark:    '#c4a96a',
  woodDark:     '#3d2b1f',
  woodMid:      '#5c3d28',
  text:         '#3d2b1f',
  textMuted:    '#7a6542',
  textDim:      '#b8985a',
  textCream:    '#f5e6c8',
  green:        '#2d5a27',
  greenLight:   '#5cb85c',
  red:          '#8b2500',
  redLight:     '#c0392b',
};

const RIGHT_COLORS = {
  education: '#4a90d9',
  food:      '#5cb85c',
  safety:    '#e67e22',
  health:    '#e74c8a',
  play:      '#9b59b6',
};
const RIGHT_ICONS = {
  education: '📚',
  food:      '🥗',
  safety:    '🛡️',
  health:    '❤️',
  play:      '🎮',
};
const ALL_RIGHTS = ['education', 'food', 'safety', 'health', 'play'];

/* ── Small reusable components ──────────────────────────────── */
const RPGDivider = () => (
  <div style={{
    height: 3,
    background: 'linear-gradient(90deg, transparent, #3d2b1f, transparent)',
    margin: '10px 0',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{
      background: THEME.parchment, padding: '0 6px',
      color: THEME.gold, fontSize: 8, position: 'relative', top: -1,
    }}>◆</span>
  </div>
);

const SectionLabel = ({ children, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 7, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: THEME.gold,
    marginBottom: 8,
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
  const [dialogue,     setDialogue]     = useState(null);
  const [quizIndex,    setQuizIndex]    = useState(0);
  const [quizScore,    setQuizScore]    = useState(0);
  const [quizDone,     setQuizDone]     = useState(false);
  const [feedback,     setFeedback]     = useState(null);
  const [badgePopup,   setBadgePopup]   = useState(null);
  const [loading,      setLoading]      = useState(true);

  /* ── Load data ──────────────────────────────────────────── */
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

  /* ── Init engine ────────────────────────────────────────── */
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

  /* ── Zone enter ─────────────────────────────────────────── */
  const handleZoneEnter = useCallback((zone) => {
    if (!zone.questions?.length) return;
    setActiveZone(zone);
    
    // Wargroove style dialogue before quiz
    const npcName = zone.position?.npc ? zone.position.npc.charAt(0).toUpperCase() + zone.position.npc.slice(1) : 'NPC';
    setDialogue({
      name: npcName,
      text: `Hold it right there! If you want to explore the ${zone.name}, you gotta answer my questions first!`,
      onComplete: () => {
        setDialogue(null);
        setQuizIndex(0);
        setQuizScore(0);
        setQuizDone(false);
        setFeedback(null);
        setQuizQuestion(zone.questions[0]);
      }
    });
    
    if (engineRef.current) engineRef.current.running = false;
  }, []);

  /* ── Answer ─────────────────────────────────────────────── */
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

  /* ── Close quiz ─────────────────────────────────────────── */
  const closeQuiz = () => {
    setActiveZone(null);
    setDialogue(null);
    setQuizQuestion(null);
    setQuizDone(false);
    setFeedback(null);
    if (engineRef.current) {
      engineRef.current.fitCanvas();
      engineRef.current.running = true;
      requestAnimationFrame(() => engineRef.current.loop());
    }
  };

  /* ── Loading screen ─────────────────────────────────────── */
  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 64, animation: 'rpgFloat 3s ease-in-out infinite' }}>🌍</div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: 14,
        color: THEME.parchLight, textShadow: '2px 2px 0 #2a1a0e',
      }}>
        Loading Rights Quest…
      </div>
      <div style={{
        fontFamily: "'VT323', monospace", fontSize: 20,
        color: THEME.gold,
      }}>Preparing your adventure</div>
    </div>
  );

  /* ── Derived state ──────────────────────────────────────── */
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
          </div>
          <div style={S.dotRow}>
            {ALL_RIGHTS.map(r => {
              const done = completedZones.some(z => z.zoneId?.right === r);
              return (
                <div key={r} title={r} style={{
                  ...S.dot,
                  background: done ? RIGHT_COLORS[r] : THEME.parchDark,
                  boxShadow: done ? `0 0 8px ${RIGHT_COLORS[r]}` : 'none',
                  border: `2px solid ${done ? RIGHT_COLORS[r] : THEME.woodDark}`,
                }}>
                  <span style={{ fontSize: 12 }}>{RIGHT_ICONS[r]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats + exit */}
        <div style={S.statsBox}>
          <div style={S.chip}>🏅 {badges.length}</div>
          <div style={S.chip}>🗺️ {progress?.totalZonesCompleted || 0}/5</div>
          <button style={S.exitBtn} onClick={logout}>◄ Exit</button>
        </div>
      </header>

      {/* ── MAIN ROW ────────────────────────────────────────── */}
      <div style={S.mainRow}>

        {/* LEFT PANEL */}
        <aside style={S.panel}>
          <div style={S.panelHead}>
            <span style={S.panelDiamond}>◆</span>
            <span>Top Heroes</span>
            <span style={S.panelDiamond}>◆</span>
          </div>
          <div style={S.panelBody}>
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
                  <div style={{ ...S.lbAvatar, background: `hsl(${i * 47}, 55%, 40%)` }}>
                    {e.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.lbName}>{e.username}</div>
                    <div style={S.lbSub}>{e.xp} XP · Lv {e.level}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </aside>

        {/* ── CANVAS ──────────────────────────────────────── */}
        <div style={S.canvasWrap}>
          <div style={S.canvasParchment}>
            <canvas ref={canvasRef} style={S.canvas} />
            <div style={S.hint}>PRESS ARROW KEYS TO EXPLORE THE REALM</div>
            
            {/* Wargroove Dialogue UI */}
            {dialogue && (
              <div style={S.dialogueWrapper}>
                <div style={S.dialogueNamePlate}>
                  <span style={{color:'#a3aebb'}}>⚔️</span> {dialogue.name}
                </div>
                <div style={S.dialogueBox}>
                  <p style={S.dialogueText}>{dialogue.text}</p>
                  <button style={S.dialogueBtn} onClick={dialogue.onComplete}>
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside style={S.panel}>
          <div style={S.panelHead}>
            <span style={S.panelDiamond}>◆</span>
            <span>My Badges</span>
            <span style={S.panelDiamond}>◆</span>
          </div>
          <div style={S.panelBody}>
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

            <RPGDivider />
            <SectionLabel icon="🗺️">Zone Status</SectionLabel>

            {ALL_RIGHTS.map(right => {
              const zone = zones.find(z => z.right === right);
              const done = completedZones.some(z => z.zoneId?.right === right);
              const col  = RIGHT_COLORS[right];
              return (
                <div key={right} style={S.zoneRow}>
                  <span style={{ fontSize: 18 }}>{RIGHT_ICONS[right]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14, fontFamily: "'VT323', monospace",
                      color: done ? col : THEME.textMuted,
                      fontWeight: done ? 700 : 400,
                    }}>
                      {zone?.name || right}
                    </div>
                    <div style={S.zoneBar}>
                      <div style={{
                        height: '100%', width: done ? '100%' : '0%',
                        background: col, transition: 'width .8s ease',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 14 }}>{done ? '✅' : '🔒'}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ── QUIZ MODAL ──────────────────────────────────────── */}
      {quizQuestion && !quizDone && (
        <div style={S.overlay}>
          <div style={S.modal}>
            {/* Modal header */}
            <div style={S.modalBanner}>
              <span style={S.modalDiamond}>◆</span>
              <span>{activeZone?.name}</span>
              <span style={S.modalDiamond}>◆</span>
            </div>
            <div style={S.modalBody}>
              <div style={S.modalHead}>
                <span style={{ fontSize: 44 }}>{RIGHT_ICONS[activeZone?.right]}</span>
                <div>
                  <h2 style={{
                    color: zoneColor, margin: 0, fontSize: 24,
                    fontFamily: "'VT323', monospace",
                  }}>
                    {activeZone?.name}
                  </h2>
                  <p style={{ color: THEME.textMuted, margin: '4px 0 0', fontSize: 18, fontFamily: "'VT323', monospace" }}>
                    {activeZone?.description}
                  </p>
                </div>
              </div>

              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {activeZone?.questions.map((_, i) => (
                  <div key={i} style={{
                    width: 12, height: 12,
                    border: '2px solid ' + THEME.woodDark,
                    transition: 'background .3s',
                    background: i < quizIndex ? THEME.greenLight : i === quizIndex ? THEME.gold : THEME.parchDark,
                  }} />
                ))}
              </div>

              {/* Question */}
              <div style={S.questionBox}>
                <p style={{
                  color: THEME.text, fontSize: 22, lineHeight: 1.5, margin: 0,
                  fontFamily: "'VT323', monospace",
                }}>
                  {quizQuestion.question}
                </p>
              </div>

              {/* Options / Feedback */}
              {!feedback ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quizQuestion.options.map((opt, i) => (
                    <button key={i} style={S.optionBtn} onClick={() => handleAnswer(i)}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #e8c252, #c19a49)';
                        e.currentTarget.style.borderColor = THEME.borderBright;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(193,154,73,0.15)';
                        e.currentTarget.style.borderColor = THEME.border;
                      }}
                    >
                      <span style={S.optLetter}>{String.fromCharCode(65 + i)}</span>
                      <span style={{ color: THEME.text, fontFamily: "'VT323', monospace", fontSize: 20 }}>{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{
                  ...S.feedbackBox,
                  borderColor: feedback.correct ? THEME.greenLight : THEME.redLight,
                  background:  feedback.correct ? 'rgba(45,90,39,0.1)' : 'rgba(139,37,0,0.1)',
                }}>
                  <div style={{ fontSize: 40 }}>{feedback.correct ? '✅' : '❌'}</div>
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                    color: feedback.correct ? THEME.greenLight : THEME.redLight,
                    margin: '10px 0 6px',
                  }}>
                    {feedback.correct ? 'Correct!' : 'Not quite!'}
                  </div>
                  <p style={{
                    color: THEME.textMuted, fontSize: 18, lineHeight: 1.5, margin: 0,
                    fontFamily: "'VT323', monospace",
                  }}>
                    {feedback.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ DONE ───────────────────────────────────────── */}
      {quizDone && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalBanner}>
              <span style={S.modalDiamond}>◆</span>
              <span>Zone Complete!</span>
              <span style={S.modalDiamond}>◆</span>
            </div>
            <div style={{ ...S.modalBody, textAlign: 'center' }}>
              <div style={{ fontSize: 72, marginBottom: 8, animation: 'rpgBounce 0.6s ease-out' }}>🎉</div>
              <h2 style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 14,
                color: THEME.gold, margin: '0 0 8px',
                textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
              }}>
                Quest Complete!
              </h2>
              <p style={{
                color: THEME.textMuted, fontSize: 20, marginBottom: 16,
                fontFamily: "'VT323', monospace",
              }}>
                You answered {quizScore} of {activeZone?.questions.length} correctly
              </p>
              <div style={S.xpReward}>
                <span style={{ fontSize: 28 }}>⭐</span>
                <span style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 14,
                  color: THEME.gold,
                }}>
                  +{activeZone?.xpReward} XP
                </span>
              </div>
              {badgePopup && (
                <div style={S.badgeUnlock}>
                  <span style={{ fontSize: 36 }}>{badgePopup.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                      color: THEME.gold,
                    }}>🎊 Badge Unlocked!</div>
                    <div style={{
                      color: THEME.textMuted, fontSize: 18, marginTop: 3,
                      fontFamily: "'VT323', monospace",
                    }}>{badgePopup.name}</div>
                  </div>
                </div>
              )}
              <button style={S.continueBtn} onClick={() => { setBadgePopup(null); closeQuiz(); }}>
                Continue Exploring →
              </button>
            </div>
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
    background: 'linear-gradient(180deg, #87CEEB 0%, #4a90d9 35%, #2c5f99 70%, #1a3a6a 100%)',
    overflow: 'hidden', color: THEME.text,
    fontFamily: "'VT323', monospace",
  },

  /* Top bar */
  topBar: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '6px 16px', flexShrink: 0,
    background: 'linear-gradient(180deg, #3d2b1f 0%, #5c3d28 50%, #3d2b1f 100%)',
    borderBottom: '4px solid #2a1a0e',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.08)',
  },
  profileBox: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 190 },
  avatar: {
    width: 38, height: 38,
    background: 'linear-gradient(180deg, #e8c252, #8b6914)',
    border: '2px solid #3d2b1f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#3d2b1f',
    flexShrink: 0, boxShadow: '2px 2px 0 rgba(0,0,0,0.4)',
  },
  username: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 8,
    color: THEME.parchLight,
  },
  roleTag: {
    fontFamily: "'VT323', monospace", fontSize: 14,
    color: THEME.gold, marginTop: 1,
  },
  levelPill: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 8,
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    border: '2px solid #8b6914', color: '#3d2b1f',
    padding: '3px 10px',
    boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
  },

  xpBox: { flex: 1, maxWidth: 450 },
  xpRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  xpLabel: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 8,
    color: THEME.gold,
  },
  xpNext: {
    fontFamily: "'VT323', monospace", fontSize: 16,
    color: THEME.textDim,
  },
  xpTrack: {
    height: 12, overflow: 'hidden', position: 'relative',
    background: THEME.parchDark,
    border: '2px solid #3d2b1f',
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3)',
  },
  xpFill: {
    position: 'absolute', height: '100%',
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 50%, #8b6914 100%)',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)',
    transition: 'width .7s ease',
  },
  dotRow: { display: 'flex', gap: 6, marginTop: 5, justifyContent: 'center' },
  dot: {
    width: 24, height: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .3s',
  },

  statsBox: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 190, justifyContent: 'flex-end' },
  chip: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 7,
    background: 'linear-gradient(180deg, #f5e6c8, #e8d5a3)',
    border: '2px solid #3d2b1f', color: '#3d2b1f',
    padding: '4px 10px',
    boxShadow: '1px 1px 0 rgba(0,0,0,0.3)',
  },
  exitBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 7,
    background: 'linear-gradient(180deg, #c44, #922)',
    border: '2px solid #611', color: '#fdd',
    padding: '5px 12px', cursor: 'pointer',
    boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
  },

  /* Main row */
  mainRow: { display: 'flex', flex: 1, minHeight: 0 },

  /* Side panels */
  panel: {
    width: 200, flexShrink: 0,
    background: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a3 50%, #c4a96a 100%)',
    borderRight: '3px solid #3d2b1f',
    borderLeft: '3px solid #3d2b1f',
    display: 'flex', flexDirection: 'column',
  },
  panelHead: {
    background: 'linear-gradient(180deg, #3d2b1f, #5c3d28, #3d2b1f)',
    padding: '6px 10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderBottom: '3px solid #2a1a0e',
    fontFamily: "'Press Start 2P', monospace", fontSize: 7,
    color: THEME.parchLight, textShadow: '1px 1px 0 #2a1a0e',
    flexShrink: 0,
  },
  panelDiamond: { color: THEME.gold, fontSize: 8 },
  panelBody: { padding: '10px 10px', overflowY: 'auto', flex: 1 },

  empty: { color: THEME.textMuted, fontSize: 16, textAlign: 'center', padding: '18px 0', lineHeight: 1.6, fontFamily: "'VT323', monospace" },

  lbRow: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 6px',
    marginBottom: 4,
    background: 'rgba(193,154,73,0.12)',
    border: '2px solid rgba(61,43,31,0.2)',
  },
  lbRowMe: {
    background: 'linear-gradient(180deg, rgba(232,194,82,0.3), rgba(193,154,73,0.3))',
    border: '2px solid #8b6914',
    boxShadow: '0 0 8px rgba(193,154,73,0.3)',
  },
  rank: { fontSize: 14, width: 22, textAlign: 'center', flexShrink: 0 },
  lbAvatar: {
    width: 24, height: 24,
    border: '2px solid #3d2b1f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Press Start 2P', monospace", fontSize: 8,
    color: '#fff', flexShrink: 0,
  },
  lbName: {
    fontFamily: "'VT323', monospace", fontSize: 16,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    color: THEME.text,
  },
  lbSub: {
    fontFamily: "'VT323', monospace", fontSize: 14, color: THEME.gold,
  },

  badgeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 },
  badgeCard: {
    background: 'rgba(193,154,73,0.15)',
    border: '2px solid rgba(61,43,31,0.2)',
    padding: '8px 4px', textAlign: 'center',
  },
  badgeName: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 5,
    color: THEME.gold, marginTop: 4, lineHeight: 1.3,
  },

  zoneRow: {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
    padding: '6px 5px',
    background: 'rgba(193,154,73,0.1)',
    border: '1px solid rgba(61,43,31,0.15)',
  },
  zoneBar: {
    height: 4, background: THEME.parchDark,
    border: '1px solid rgba(61,43,31,0.3)',
    marginTop: 3, overflow: 'hidden',
  },

  /* Canvas area */
  canvasWrap: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column',
    background: 'url("/rpg-bg.png") center/cover no-repeat',
    borderLeft: '3px solid #3d2b1f',
    borderRight: '3px solid #3d2b1f',
    padding: '24px 32px', // Framing it exactly like the screenshot
    position: 'relative'
  },
  canvasParchment: {
    flex: 1, minHeight: 0,
    display: 'flex', flexDirection: 'column',
    background: '#1a3a6a', // Fallback color
    border: '4px solid #3d2b1f',
    boxShadow: '8px 8px 0px rgba(0,0,0,0.4)',
    position: 'relative'
  },
  canvas: {
    display: 'block', flex: 1, minHeight: 0,
    width: '100%', imageRendering: 'pixelated',
  },
  hint: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 6,
    color: 'rgba(245,230,200,0.4)',
    textAlign: 'center', padding: '5px 0', flexShrink: 0,
    background: 'rgba(61,43,31,0.6)', letterSpacing: '0.04em',
  },

  /* Dialogue Box Overlay */
  dialogueWrapper: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    zIndex: 100, animation: 'rpgBounce 0.3s ease-out',
  },
  dialogueNamePlate: {
    background: 'linear-gradient(180deg, #53455a, #3d3444)',
    border: '3px solid #281d30',
    borderBottom: 'none',
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
    padding: '6px 16px',
    fontFamily: "'Press Start 2P', monospace", fontSize: 10,
    color: '#eaeaea', textShadow: '2px 2px 0 #000',
    zIndex: 1, position: 'relative', left: 4, top: 3,
  },
  dialogueBox: {
    background: 'linear-gradient(180deg, #fbf2cd, #e9d5a1)',
    border: '4px solid #4a3e4d',
    padding: '16px 20px', width: '100%', maxWidth: 700,
    boxShadow: '6px 6px 0 rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  },
  dialogueText: {
    margin: 0, fontFamily: "'VT323', monospace", fontSize: 24,
    color: '#3d2b1f', lineHeight: 1.2,
  },
  dialogueBtn: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 8,
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    border: '2px solid #8b6914', color: '#3d2b1f',
    padding: '8px 16px', cursor: 'pointer', flexShrink: 0,
    boxShadow: '3px 3px 0 #3d2b1f', textShadow: '1px 1px 0 rgba(255,255,255,0.4)',
  },

  /* Overlay / Modal */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(26,14,4,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a3 50%, #c4a96a 100%)',
    border: '4px solid #3d2b1f',
    width: '90%', maxWidth: 480,
    boxShadow: '6px 6px 0 #2a1a0e, inset 2px 2px 0 rgba(255,255,255,0.3)',
    animation: 'rpgFadeIn 0.3s ease-out',
  },
  modalBanner: {
    background: 'linear-gradient(180deg, #3d2b1f, #5c3d28, #3d2b1f)',
    padding: '10px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderBottom: '3px solid #2a1a0e',
    fontFamily: "'Press Start 2P', monospace", fontSize: 10,
    color: THEME.parchLight, textShadow: '2px 2px 0 #2a1a0e',
  },
  modalDiamond: { color: THEME.gold, fontSize: 10 },
  modalBody: { padding: '20px 24px' },
  modalHead: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 },
  questionBox: {
    background: 'rgba(193,154,73,0.15)',
    border: '2px solid rgba(61,43,31,0.3)',
    padding: 14, marginBottom: 14,
  },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    border: '2px solid ' + THEME.border,
    background: 'rgba(193,154,73,0.15)',
    cursor: 'pointer', textAlign: 'left',
    transition: 'all .15s',
    boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
  },
  optLetter: {
    width: 28, height: 28, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    border: '2px solid #8b6914',
    fontFamily: "'Press Start 2P', monospace", fontSize: 9,
    color: '#3d2b1f',
  },
  feedbackBox: {
    border: '3px solid', padding: 18, textAlign: 'center',
  },
  xpReward: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    margin: '14px 0',
    background: 'rgba(193,154,73,0.2)',
    border: '2px solid rgba(139,105,20,0.4)',
    padding: 12,
  },
  badgeUnlock: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(193,154,73,0.15)',
    border: '2px solid rgba(139,105,20,0.3)',
    padding: 10, margin: '10px 0', textAlign: 'left',
  },
  continueBtn: {
    width: '100%', padding: 14, border: '3px solid #8b6914',
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 50%, #8b6914 100%)',
    color: '#3d2b1f',
    fontFamily: "'Press Start 2P', monospace", fontSize: 10,
    cursor: 'pointer', marginTop: 10,
    boxShadow: '3px 3px 0 #3d2b1f',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
    letterSpacing: '0.03em',
  },
};

export default Game;