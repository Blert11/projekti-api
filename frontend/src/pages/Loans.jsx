import { useEffect, useState } from 'react';
import * as loansApi from '../api/loans';
import { listBooks } from '../api/books';
import { listMembers } from '../api/members';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const PAGE_SIZE = 10;
const dateFmt = (d) => new Date(d).toLocaleDateString();

export default function Loans() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [bookId, setBookId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');

    if (isStaff) {
      const params = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      loansApi
        .listLoans(params)
        .then((res) => {
          setLoans(res.items);
          setPagination(res.pagination);
        })
        .catch((err) => setError(apiErrorMessage(err, 'Failed to load loans')))
        .finally(() => setLoading(false));
    } else {
      loansApi
        .myLoans()
        .then((items) => {
          const filtered = status ? items.filter((l) => l.status === status) : items;
          setLoans(filtered);
          setPagination({ page: 1, pages: 1 });
        })
        .catch((err) => setError(apiErrorMessage(err, 'Failed to load loans')))
        .finally(() => setLoading(false));
    }
  };

  useEffect(load, [isStaff, status, page]);

  const handleReturn = async (loan) => {
    setError('');
    setNotice('');
    try {
      await loansApi.returnLoan(loan.id);
      setNotice(`Returned "${loan.book?.title}".`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to return book'));
    }
  };

  const handleMarkOverdue = async () => {
    setError('');
    setNotice('');
    try {
      const result = await loansApi.markOverdue();
      setNotice(`Marked ${result.markedOverdue} loan(s) as overdue.`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to mark overdue loans'));
    }
  };

  const openNewLoan = () => {
    setBookId('');
    setMemberId('');
    setFormError('');
    setModalOpen(true);
    Promise.all([listBooks({ limit: 100, available: 'true' }), listMembers({ limit: 100 })])
      .then(([b, m]) => {
        setBooks(b.items);
        setMembers(m.items);
      })
      .catch((err) => setFormError(apiErrorMessage(err, 'Failed to load form data')));
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await loansApi.borrowBook({ bookId: Number(bookId), memberId: Number(memberId) });
      setNotice('Loan created.');
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Failed to create loan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isStaff ? 'Loans' : 'My loans'}</h1>
          <p>{isStaff ? 'All loans across the library.' : 'Books you currently have or have borrowed.'}</p>
        </div>
        {isStaff && (
          <div className="actions-cell">
            <button className="btn btn-secondary" onClick={handleMarkOverdue}>
              Mark overdue
            </button>
            <button className="btn btn-primary" onClick={openNewLoan}>
              + New loan
            </button>
          </div>
        )}
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="filters">
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RETURNED">Returned</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : loans.length === 0 ? (
        <div className="card empty-state">No loans found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                {isStaff && <th>Member</th>}
                <th>Loan date</th>
                <th>Due date</th>
                <th>Return date</th>
                <th>Status</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.book?.title}</td>
                  {isStaff && <td>{loan.member?.user?.name}</td>}
                  <td>{dateFmt(loan.loanDate)}</td>
                  <td>{dateFmt(loan.dueDate)}</td>
                  <td>{loan.returnDate ? dateFmt(loan.returnDate) : '—'}</td>
                  <td>
                    <StatusBadge status={loan.status} />
                  </td>
                  <td className="actions">
                    {loan.status !== 'RETURNED' ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleReturn(loan)}>
                        Return
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isStaff && <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />}

      {modalOpen && (
        <Modal title="New loan" onClose={() => setModalOpen(false)}>
          <Alert>{formError}</Alert>
          <form onSubmit={handleCreateLoan}>
            <div className="form-group">
              <label htmlFor="loanBook">Book</label>
              <select id="loanBook" value={bookId} onChange={(e) => setBookId(e.target.value)} required>
                <option value="">Select an available book</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.availableCopies} available)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="loanMember">Member</label>
              <select
                id="loanMember"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user?.name} ({m.user?.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create loan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
