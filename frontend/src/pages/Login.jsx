import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authAPI';
import { useAuth } from '../hooks/useAuth';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      login(data.user, data.token);
      if (data.user.role === 'child') navigate('/game');
      else if (data.user.role === 'parent') navigate('/parent');
      else if (data.user.role === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <span style={styles.bannerText}>Rights Quest</span>
          <div style={styles.bannerDiamond}>◆</div>
        </div>

        {/* Inner gold border */}
        <div style={styles.innerBorder}>
          <div style={styles.logo}>🌍</div>
          <p style={styles.subtitle}>Learn your rights, earn your badges!</p>

          {error && <div style={styles.error}>⚠ {error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>📧 Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>🔑 Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? '⏳ Entering...' : '⚔️ Start Adventure'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerDiamond}>◆</span>
          </div>

          <p style={styles.link}>
            New here?{' '}
            <Link to="/register" style={styles.linkText}>Create account</Link>
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
    maxWidth: '420px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
    animation: 'rpgFadeIn 0.5s ease-out',
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
  },
  bannerText: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '16px',
    color: '#f5e6c8',
    textShadow: '2px 2px 0 #2a1a0e',
    letterSpacing: '1px',
  },
  bannerDiamond: {
    color: '#c19a49',
    fontSize: '12px',
  },
  innerBorder: {
    margin: '8px',
    padding: '24px 28px',
    border: '2px solid rgba(193, 154, 73, 0.5)',
    position: 'relative',
  },
  logo: {
    fontSize: '56px',
    marginBottom: '8px',
    filter: 'drop-shadow(2px 2px 0 #3d2b1f)',
    animation: 'rpgFloat 4s ease-in-out infinite',
  },
  subtitle: {
    color: '#7a6542',
    marginBottom: '24px',
    fontSize: '20px',
    fontFamily: "'VT323', monospace",
    letterSpacing: '0.5px',
  },
  error: {
    background: 'rgba(139, 37, 0, 0.15)',
    border: '2px solid #8b2500',
    color: '#8b2500',
    padding: '10px',
    marginBottom: '15px',
    fontSize: '18px',
    fontFamily: "'VT323', monospace",
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    textAlign: 'left',
  },
  label: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '8px',
    color: '#7a6542',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'linear-gradient(180deg, #d4bc82 0%, #c9b078 100%)',
    border: '2px solid #3d2b1f',
    color: '#3d2b1f',
    fontSize: '20px',
    fontFamily: "'VT323', monospace",
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.25), inset -1px -1px 2px rgba(255,255,255,0.15)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    padding: '14px',
    border: '3px solid #8b6914',
    background: 'linear-gradient(180deg, #e8c252 0%, #c19a49 50%, #8b6914 100%)',
    color: '#3d2b1f',
    fontSize: '12px',
    fontFamily: "'Press Start 2P', monospace",
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '3px 3px 0px #3d2b1f',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '6px',
    transition: 'all 0.1s',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
  divider: {
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #3d2b1f, transparent)',
    margin: '20px 0 16px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerDiamond: {
    background: '#e8d5a3',
    padding: '0 10px',
    color: '#c19a49',
    fontSize: '10px',
    position: 'relative',
    top: '-1px',
  },
  link: {
    color: '#7a6542',
    fontSize: '18px',
    fontFamily: "'VT323', monospace",
  },
  linkText: {
    color: '#8b6914',
    textDecoration: 'none',
    fontWeight: 'bold',
    borderBottom: '2px dashed #c19a49',
    paddingBottom: '1px',
  },
  _unused: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'linear-gradient(180deg, #5a8f3c 0%, #4a7a2f 30%, #3d6625 100%)',
    borderTop: '4px solid #2d5a27',
    boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.1)',
    zIndex: 1,
  },
};

export default Login;