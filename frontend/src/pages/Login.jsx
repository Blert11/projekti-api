import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import * as mfaApi from '../api/mfa';
import Alert from '../components/Alert';

export default function Login() {
  const { login, completeMfaLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mfaToken, setMfaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.requiresMfa) {
        setMfaToken(result.mfaToken);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await mfaApi.verifyMfa(mfaToken, code);
      completeMfaLogin(result);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  if (mfaToken) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h1>Two-factor code</h1>
          <p className="auth-subtitle">Enter the 6-digit code from your authenticator app</p>
          <Alert>{error}</Alert>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="code">Authentication code</label>
              <input
                id="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoFocus
                required
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              className="link-btn"
              style={{ marginTop: '0.75rem' }}
              onClick={() => {
                setMfaToken(null);
                setCode('');
                setError('');
              }}
            >
              &larr; Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>📚 Library</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <Alert>{error}</Alert>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
