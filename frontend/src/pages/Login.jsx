import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authAPI';
import { useAuth } from '../hooks/useAuth';

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
        <div style={styles.logo}>🌍</div>
        <h1 style={styles.title}>Rights Quest</h1>
        <p style={styles.subtitle}>Learn your rights, earn your badges!</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : '🎮 Start Adventure'}
          </button>
        </form>

        <p style={styles.link}>
          New here?{' '}
          <Link to="/register" style={styles.linkText}>Create account</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
  },
  card: {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,215,0,0.3)', borderRadius: '20px',
    padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center'
  },
  logo: { fontSize: '60px', marginBottom: '10px' },
  title: { fontSize: '32px', color: '#FFD700', marginBottom: '8px', fontWeight: 'bold' },
  subtitle: { color: '#aaa', marginBottom: '30px', fontSize: '14px' },
  error: {
    background: 'rgba(255,82,82,0.2)', border: '1px solid #ff5252',
    color: '#ff5252', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: {
    padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)',
    background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '16px', outline: 'none'
  },
  button: {
    padding: '14px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#1a1a2e', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
  },
  link: { marginTop: '20px', color: '#aaa', fontSize: '14px' },
  linkText: { color: '#FFD700', textDecoration: 'none', fontWeight: 'bold' }
};

export default Login;