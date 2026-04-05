import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authAPI';
import { useAuth } from '../hooks/useAuth';
import '../App.css';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'child' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerUser(form);
      login(data.user, data.token);
      if (data.user.role === 'child') navigate('/game');
      else if (data.user.role === 'parent') navigate('/parent');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Ornate top banner */}
        <div style={styles.banner}>
          <div style={styles.bannerDiamond}>◆</div>
          <span style={styles.bannerText}>Join the Quest</span>
          <div style={styles.bannerDiamond}>◆</div>
        </div>

        <div style={styles.innerBorder}>
          <div style={styles.logo}>🌟</div>
          <p style={styles.subtitle}>Create your account and start learning!</p>

          {error && <div style={styles.error}>⚠ {error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>🧙 Username</label>
              <input style={styles.input} name="username" placeholder="Choose a username"
                value={form.username} onChange={handleChange} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>📧 Email</label>
              <input style={styles.input} type="email" name="email" placeholder="Enter your email"
                value={form.email} onChange={handleChange} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>🔑 Password</label>
              <input style={styles.input} type="password" name="password" placeholder="Enter your password"
                value={form.password} onChange={handleChange} required />
            </div>

            {/* Role selection as RPG class choice */}
            <div style={styles.roleSection}>
              <label style={styles.label}>⚔️ I am a</label>
              <div style={styles.roleButtons}>
                {['child', 'parent'].map(role => (
                  <button key={role} type="button"
                    style={{
                      ...styles.roleBtn,
                      ...(form.role === role ? styles.roleBtnActive : {}),
                    }}
                    onClick={() => setForm({ ...form, role })}
                  >
                    <span style={styles.roleIcon}>{role === 'child' ? '🧒' : '👨‍👩‍👧'}</span>
                    <span style={styles.roleName}>{role === 'child' ? 'Child' : 'Parent'}</span>
                    <span style={styles.roleDesc}>{role === 'child' ? 'Explorer' : 'Guardian'}</span>
                  </button>
                ))}
              </div>
            </div>

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? '⏳ Creating...' : '🚀 Create Account'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerDiamond}>◆</span>
          </div>

          <p style={styles.link}>
            Already have an account?{' '}
            <Link to="/login" style={styles.linkText}>Login</Link>
          </p>
        </div>
      </div>

    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'VT323', monospace",
  },
  card: {
    background: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a3 50%, #c4a96a 100%)',
    border: '4px solid #3d2b1f',
    boxShadow: '6px 6px 0px #2a1a0e, inset 2px 2px 0px rgba(255,255,255,0.3), inset -2px -2px 0px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '440px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
    animation: 'rpgFadeIn 0.5s ease-out',
    maxHeight: '92vh',
    overflowY: 'auto',
  },
  banner: {
    background: 'linear-gradient(180deg, #3d2b1f 0%, #5c3d28 50%, #3d2b1f 100%)',
    padding: '10px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    borderBottom: '3px solid #2a1a0e',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  bannerText: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '14px',
    color: '#f5e6c8',
    textShadow: '2px 2px 0 #2a1a0e',
    letterSpacing: '1px',
  },
  bannerDiamond: { color: '#c19a49', fontSize: '12px' },
  innerBorder: {
    margin: '8px',
    padding: '20px 24px',
    border: '2px solid rgba(193, 154, 73, 0.5)',
  },
  logo: {
    fontSize: '48px', marginBottom: '6px',
    filter: 'drop-shadow(2px 2px 0 #3d2b1f)',
    animation: 'rpgFloat 4s ease-in-out infinite',
  },
  subtitle: {
    color: '#7a6542', marginBottom: '20px', fontSize: '18px',
    fontFamily: "'VT323', monospace",
  },
  error: {
    background: 'rgba(139, 37, 0, 0.15)', border: '2px solid #8b2500',
    color: '#8b2500', padding: '10px', marginBottom: '15px',
    fontSize: '18px', fontFamily: "'VT323', monospace",
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fieldGroup: { textAlign: 'left' },
  label: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
    color: '#7a6542', textTransform: 'uppercase', letterSpacing: '1px',
    marginBottom: '5px', display: 'block',
  },
  input: {
    width: '100%', padding: '10px 14px',
    background: 'linear-gradient(180deg, #d4bc82 0%, #c9b078 100%)',
    border: '2px solid #3d2b1f', color: '#3d2b1f', fontSize: '20px',
    fontFamily: "'VT323', monospace",
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.25), inset -1px -1px 2px rgba(255,255,255,0.15)',
    outline: 'none', boxSizing: 'border-box',
  },
  roleSection: { textAlign: 'left' },
  roleButtons: { display: 'flex', gap: '10px', marginTop: '6px' },
  roleBtn: {
    flex: 1, padding: '12px 8px',
    background: 'linear-gradient(180deg, #d4bc82 0%, #c9b078 100%)',
    border: '2px solid #3d2b1f', cursor: 'pointer',
    boxShadow: '2px 2px 0px #3d2b1f',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    transition: 'all 0.15s',
  },
  roleBtnActive: {
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 100%)',
    border: '2px solid #8b6914',
    boxShadow: '2px 2px 0px #3d2b1f, 0 0 12px rgba(193,154,73,0.5)',
    transform: 'translateY(-2px)',
  },
  roleIcon: { fontSize: '28px' },
  roleName: {
    fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
    color: '#3d2b1f', textTransform: 'uppercase',
  },
  roleDesc: {
    fontFamily: "'VT323', monospace", fontSize: '16px', color: '#7a6542',
  },
  button: {
    padding: '14px', border: '3px solid #8b6914',
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 50%, #8b6914 100%)',
    color: '#3d2b1f', fontSize: '11px',
    fontFamily: "'Press Start 2P', monospace", fontWeight: 'bold',
    cursor: 'pointer', boxShadow: '3px 3px 0px #3d2b1f',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px',
    transition: 'all 0.1s',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
  divider: {
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #3d2b1f, transparent)',
    margin: '18px 0 14px',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dividerDiamond: {
    background: '#e8d5a3', padding: '0 10px',
    color: '#c19a49', fontSize: '10px', position: 'relative', top: '-1px',
  },
  link: { color: '#7a6542', fontSize: '18px', fontFamily: "'VT323', monospace" },
  linkText: {
    color: '#8b6914', textDecoration: 'none', fontWeight: 'bold',
    borderBottom: '2px dashed #c19a49', paddingBottom: '1px',
  },
};

export default Register;