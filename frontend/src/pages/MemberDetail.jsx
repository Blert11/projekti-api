import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as membersApi from '../api/members';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const dateFmt = (d) => new Date(d).toLocaleDateString();

export default function MemberDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [newPassword, setNewPassword] = useState('');
  const [forceDisableMfa, setForceDisableMfa] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    membersApi
      .getMember(id)
      .then((m) => {
        setMember(m);
        setPhone(m.phone || '');
        setAddress(m.address || '');
        setName(m.user?.name || '');
        setEmail(m.user?.email || '');
        setRole(m.user?.role || 'MEMBER');
        setNewPassword('');
        setForceDisableMfa(false);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load member')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const payload = {
        phone: phone || undefined,
        address: address || undefined,
      };
      if (isAdmin) {
        if (name !== (member.user?.name || '')) payload.name = name;
        if (email !== (member.user?.email || '')) payload.email = email;
        if (role !== member.user?.role) payload.role = role;
        if (newPassword) payload.password = newPassword;
        if (forceDisableMfa && member.user?.mfaEnabled) payload.mfaEnabled = false;
      }
      await membersApi.updateMember(id, payload);
      setNotice('Member updated.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update member'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (!member) return <Alert>{error}</Alert>;

  return (
    <div>
      <Link to="/members" className="link-btn">
        &larr; Back to members
      </Link>

      <div className="page-header" style={{ marginTop: '1rem' }}>
        <div>
          <h1>{member.user?.name}</h1>
          <p>
            {member.user?.email} &middot; {member.user?.role}
            {member.user?.mfaEnabled ? ' · MFA ON' : ''}
          </p>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2>{isAdmin ? 'Edit member' : 'Contact details'}</h2>
        <form onSubmit={handleSave}>
          {isAdmin && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="LIBRARIAN">LIBRARIAN</option>
                    <option value="MEMBER">MEMBER</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New password (optional, min 8)</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              {member.user?.mfaEnabled && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={forceDisableMfa}
                      onChange={(e) => setForceDisableMfa(e.target.checked)}
                    />{' '}
                    Force-disable this user's MFA
                  </label>
                </div>
              )}
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <h2>Loan history</h2>
      {member.loans?.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Loan date</th>
                <th>Due date</th>
                <th>Return date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {member.loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.book?.title}</td>
                  <td>{dateFmt(loan.loanDate)}</td>
                  <td>{dateFmt(loan.dueDate)}</td>
                  <td>{loan.returnDate ? dateFmt(loan.returnDate) : '—'}</td>
                  <td>
                    <StatusBadge status={loan.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">No loans yet.</div>
      )}
    </div>
  );
}
