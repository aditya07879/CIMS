import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Spinner, Select } from '../components/common/index.jsx';
import { DEPARTMENTS, SECTIONS } from '../utils/helpers.js';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', department: 'CSE', year: '1', section: 'A' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (k) => (val) => setForm(f => ({ ...f, [k]: val }));
  const handleInput = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await register({ ...form, role: 'student', year: parseInt(form.year) });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const labelStyle = { display: 'block', fontSize: '10px', color: '#64748B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#1E293B', backgroundImage: `linear-gradient(rgba(249,115,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,98,0.03) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '46px', height: '46px', background: '#F97362', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: 'white', margin: '0 auto 14px', position: 'relative' }}>
            C
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '9px', height: '9px', background: '#1E293B', border: '2px solid #F97362' }} />
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#F1F5F9', letterSpacing: '-0.03em' }}>Create account</h1>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '5px', fontFamily: 'Inter, sans-serif' }}>Student self-registration</p>
        </div>

        <div style={{ background: '#243044', border: '1px solid #2D3F5A', borderTop: '2px solid #F97362', padding: '28px' }}>
          <Alert message={error} />
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div><label style={labelStyle}>Full Name</label><input className="input" placeholder="John Doe" value={form.name} onChange={handleInput('name')} required /></div>
              <div><label style={labelStyle}>Email</label><input type="email" className="input" placeholder="you@college.edu" value={form.email} onChange={handleInput('email')} required /></div>
              <div><label style={labelStyle}>Password</label><input type="password" className="input" placeholder="min. 6 characters" value={form.password} onChange={handleInput('password')} required minLength={6} /></div>
              <div>
                <label style={labelStyle}>Role</label>
                <div className="input" style={{ background: 'rgba(20,30,46,0.6)', color: '#64748B', cursor: 'not-allowed' }}>Student</div>
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>Admin/HOD/Mentor accounts are created by administrators.</p>
              </div>
              <div><label style={labelStyle}>Roll Number</label><input className="input" placeholder="2021CSE001" value={form.rollNumber} onChange={handleInput('rollNumber')} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <Select label="Dept"    value={form.department} onChange={handle('department')} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
                <Select label="Year"    value={form.year}       onChange={handle('year')}       options={[1,2,3,4].map(y => ({ value: String(y), label: `Y${y}` }))} />
                <Select label="Section" value={form.section}    onChange={handle('section')}    options={SECTIONS.map(s => ({ value: s, label: s }))} />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '11px', marginTop: '4px' }} disabled={loading}>
                {loading ? <><Spinner size="sm" /> Creating...</> : 'Create Account →'}
              </button>
            </div>
          </form>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', marginTop: '18px' }}>
            Already registered? <Link to="/login" style={{ color: '#F97362', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
