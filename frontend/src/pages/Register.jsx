import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authAPI';
import { useAuth } from '../hooks/useAuth';

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
        <div style={styles.logo}>🌟</div>
        <h1 style={styles.title}>Join Rights Quest</h1>
        <p style={styles.subtitle}>Create your account and start learning!</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="username" placeholder="Username"
            value={form.username} onChange={handleChange} required />
          <input style={styles.input} type="email" name="email" placeholder="Email"
            value={form.email} onChange={handleChange} required />
          <input style={styles.input} type="password" name="password" placeholder="Password"
            value={form.password} onChange={handleChange} required />

          <div style={styles.roleContainer}>
            <p style={styles.roleLabel}>I am a:</p>
            <div style={styles.roleButtons}>
              {['child', 'parent'].map(role => (
                <button key={role} type="button"
                  style={{ ...styles.roleBtn, ...(form.role === role ? styles.roleBtnActive : {}) }}
                  onClick={() => setForm({ ...form, role })}>
                  {role === 'child' ? '🧒 Child' : '👨‍👩‍👧 Parent'}
                </button>
              ))}
            </div>
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : '🚀 Create Account'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account?{' '}
          <Link to="/login" style={styles.linkText}>Login</Link>
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
  title: { fontSize: '28px', color: '#FFD700', marginBottom: '8px', fontWeight: 'bold' },
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
  roleContainer: { textAlign: 'left' },
  roleLabel: { color: '#aaa', fontSize: '14px', marginBottom: '8px' },
  roleButtons: { display: 'flex', gap: '10px' },
  roleBtn: {
    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)',
    background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px'
  },
  roleBtnActive: { background: 'rgba(255,215,0,0.2)', border: '1px solid #FFD700', color: '#FFD700' },
  button: {
    padding: '14px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#1a1a2e', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
  },
  link: { marginTop: '20px', color: '#aaa', fontSize: '14px' },
  linkText: { color: '#FFD700', textDecoration: 'none', fontWeight: 'bold' }
};

export default Register;