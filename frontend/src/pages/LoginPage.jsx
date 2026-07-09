import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Spinner } from '../components/common/index.jsx';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: '#1E293B',
      backgroundImage: `
        linear-gradient(rgba(249,115,98,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(249,115,98,0.03) 1px, transparent 1px),
        radial-gradient(ellipse 60% 60% at 50% 50%, rgba(249,115,98,0.06) 0%, transparent 70%)
      `,
      backgroundSize: '32px 32px, 32px 32px, 100% 100%',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }} className="fade-in">

        {/* Logo block */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: '#F97362',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: 'white',
            margin: '0 auto 16px',
            position: 'relative',
          }}>
            C
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '10px', height: '10px', background: '#1E293B', border: '2px solid #F97362' }} />
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '24px', color: '#F1F5F9', letterSpacing: '-0.03em' }}>Welcome back</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>CIMS · College Issue Management</p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#243044',
          border: '1px solid #2D3F5A',
          borderTop: '2px solid #F97362',
          padding: '32px',
          position: 'relative',
        }}>
          <Alert message={error} />

          <form onSubmit={submit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#64748B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Email address
              </label>
              <input type="email" className="input" placeholder="you@college.edu" value={form.email} onChange={handle('email')} required />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#64748B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Password
              </label>
              <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={handle('password')} required />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
              {loading ? <><Spinner size="sm" /> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', marginTop: '20px' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#F97362', textDecoration: 'none', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>

        {/* Decorative corners */}
        <div style={{ position: 'relative', marginTop: '0', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderLeft: '2px solid rgba(249,115,98,0.3)', borderBottom: '2px solid rgba(249,115,98,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderRight: '2px solid rgba(249,115,98,0.3)', borderBottom: '2px solid rgba(249,115,98,0.3)' }} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
