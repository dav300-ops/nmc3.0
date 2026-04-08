import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { Stethoscope } from 'lucide-react';

 const API_URL = import.meta.env.VITE_API_URL || '';

const styles = {
  logo: { marginBottom: '1rem' },
  error: { color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' as const, fontSize: '0.875rem' },
  submitBtn: { width: '100%', marginTop: '1rem' },
  footer: { marginTop: '1.5rem', textAlign: 'center' as const, fontSize: '0.875rem' },
  footerText: { color: 'var(--text-muted)' },
  footerLink: { color: 'var(--primary-color)', fontWeight: '500' },
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  console.log('API_URL:', API_URL); // should print your backend URL, not empty string
  try {
   
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    console.log('Response data:', response.data); 
    console.log('API_URL:', API_URL); // should print your backend URL, not empty string
    login(response.data.token, response.data.user);
    navigate('/');
  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Stethoscope size={48} color="#3b82f6" style={styles.logo} />
          <h1>Clinic CRM</h1>
          <p>Login to your account</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account? </span>
          <Link to="/register" style={styles.footerLink}>Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;