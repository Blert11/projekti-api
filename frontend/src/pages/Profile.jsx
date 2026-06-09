import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as mfaApi from '../api/mfa';
import { apiErrorMessage } from '../api/client';
import Alert from '../components/Alert';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const [setupData, setSetupData] = useState(null);
  const [enableCode, setEnableCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const startSetup = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const data = await mfaApi.setupMfa();
      setSetupData(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to start MFA setup'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await mfaApi.enableMfa(enableCode);
      setNotice('MFA enabled successfully.');
      setSetupData(null);
      setEnableCode('');
      await refreshUser();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to enable MFA'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await mfaApi.disableMfa(disableCode);
      setNotice('MFA disabled.');
      setDisableCode('');
      await refreshUser();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to disable MFA'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Your account details and security settings.</p>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2>Account</h2>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>
              {user?.name}
            </span>
            <span className="stat-label">Name</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>
              {user?.email}
            </span>
            <span className="stat-label">Email</span>
          </div>
          <div className="stat-card">
            <span className="badge badge-role" style={{ width: 'fit-content' }}>
              {user?.role}
            </span>
            <span className="stat-label" style={{ marginTop: '0.25rem' }}>
              Role
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Two-factor authentication (TOTP)</h2>
        <p>Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).</p>

        {user?.mfaEnabled ? (
          <>
            <div className="alert alert-success">MFA is currently enabled on your account.</div>
            <form onSubmit={handleDisable}>
              <div className="form-group">
                <label htmlFor="disableCode">Enter a code to disable MFA</label>
                <input
                  id="disableCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              <button className="btn btn-danger" type="submit" disabled={loading}>
                {loading ? 'Disabling...' : 'Disable MFA'}
              </button>
            </form>
          </>
        ) : setupData ? (
          <div className="qr-box">
            <p>Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.</p>
            <img src={setupData.qrCodeDataUrl} alt="MFA QR code" width={200} height={200} />
            <span className="secret-code">{setupData.secret}</span>
            <form onSubmit={handleEnable} style={{ width: '100%', maxWidth: 260 }}>
              <div className="form-group">
                <label htmlFor="enableCode">Confirmation code</label>
                <input
                  id="enableCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={enableCode}
                  onChange={(e) => setEnableCode(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? 'Enabling...' : 'Enable MFA'}
              </button>
            </form>
            <button className="link-btn" onClick={() => setSetupData(null)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={startSetup} disabled={loading}>
            {loading ? 'Loading...' : 'Set up MFA'}
          </button>
        )}
      </div>
    </div>
  );
}
