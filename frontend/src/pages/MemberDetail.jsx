import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as membersApi from '../api/members';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const dateFmt = (d) => new Date(d).toLocaleDateString();

export default function MemberDetail() {
  const { id } = useParams();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
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
      await membersApi.updateMember(id, { phone: phone || undefined, address: address || undefined });
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
          </p>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2>Contact details</h2>
        <form onSubmit={handleSave}>
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
