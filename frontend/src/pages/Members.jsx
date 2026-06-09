import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as membersApi from '../api/members';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;
const dateFmt = (d) => new Date(d).toLocaleDateString();

export default function Members() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    const params = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    membersApi
      .listMembers(params)
      .then((res) => {
        setMembers(res.items);
        setPagination(res.pagination);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load members')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search]);

  const handleDelete = async (member) => {
    if (!window.confirm(`Delete member "${member.user?.name}"? This removes their account.`)) return;
    setError('');
    try {
      await membersApi.deleteMember(member.id);
      setNotice('Member deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete member'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Members</h1>
          <p>Registered library members.</p>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="filters">
        <input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : members.length === 0 ? (
        <div className="card empty-state">No members found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Member since</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.user?.name}</td>
                  <td>{member.user?.email}</td>
                  <td>{member.phone || '—'}</td>
                  <td>{dateFmt(member.membershipDate)}</td>
                  <td className="actions">
                    <div className="actions-cell">
                      <Link to={`/members/${member.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      {isAdmin && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(member)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
    </div>
  );
}
