import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listBooks } from '../api/books';
import { listAuthors } from '../api/authors';
import { listCategories } from '../api/categories';
import { listLoans, myLoans } from '../api/loans';
import { listMembers } from '../api/members';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { apiErrorMessage } from '../api/client';

const dateFmt = (d) => new Date(d).toLocaleDateString();

export default function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [stats, setStats] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        if (isStaff) {
          const [books, authors, categories, active, overdue, members, recent] = await Promise.all([
            listBooks({ limit: 1 }),
            listAuthors(),
            listCategories(),
            listLoans({ status: 'ACTIVE', limit: 1 }),
            listLoans({ status: 'OVERDUE', limit: 1 }),
            listMembers({ limit: 1 }),
            listLoans({ limit: 5 }),
          ]);
          if (cancelled) return;
          setStats({
            books: books.pagination.total,
            authors: authors.length,
            categories: categories.length,
            activeLoans: active.pagination.total,
            overdueLoans: overdue.pagination.total,
            members: members.pagination.total,
          });
          setRecentLoans(recent.items);
        } else {
          const [books, authors, categories, mine] = await Promise.all([
            listBooks({ limit: 1 }),
            listAuthors(),
            listCategories(),
            myLoans(),
          ]);
          if (cancelled) return;
          const active = mine.filter((l) => l.status === 'ACTIVE');
          const overdue = mine.filter((l) => l.status === 'OVERDUE');
          setStats({
            books: books.pagination.total,
            authors: authors.length,
            categories: categories.length,
            myActiveLoans: active.length,
            myOverdueLoans: overdue.length,
          });
          setRecentLoans(mine.slice(0, 5));
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Failed to load dashboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p>Here&apos;s what&apos;s happening in the library.</p>
        </div>
      </div>

      <Alert>{error}</Alert>

      {loading || !stats ? (
        <Spinner />
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <span className="stat-value">{stats.books}</span>
              <span className="stat-label">Books</span>
            </div>
            <div className="card stat-card">
              <span className="stat-value">{stats.authors}</span>
              <span className="stat-label">Authors</span>
            </div>
            <div className="card stat-card">
              <span className="stat-value">{stats.categories}</span>
              <span className="stat-label">Categories</span>
            </div>
            {isStaff ? (
              <>
                <div className="card stat-card">
                  <span className="stat-value">{stats.activeLoans}</span>
                  <span className="stat-label">Active loans</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-value">{stats.overdueLoans}</span>
                  <span className="stat-label">Overdue loans</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-value">{stats.members}</span>
                  <span className="stat-label">Members</span>
                </div>
              </>
            ) : (
              <>
                <div className="card stat-card">
                  <span className="stat-value">{stats.myActiveLoans}</span>
                  <span className="stat-label">My active loans</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-value">{stats.myOverdueLoans}</span>
                  <span className="stat-label">My overdue loans</span>
                </div>
              </>
            )}
          </div>

          <div className="page-header">
            <h2>{isStaff ? 'Recent loans' : 'My recent loans'}</h2>
            <Link to="/loans" className="link-btn">
              View all
            </Link>
          </div>

          {recentLoans.length === 0 ? (
            <div className="card empty-state">No loans yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    {isStaff && <th>Member</th>}
                    <th>Loan date</th>
                    <th>Due date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.book?.title}</td>
                      {isStaff && <td>{loan.member?.user?.name}</td>}
                      <td>{dateFmt(loan.loanDate)}</td>
                      <td>{dateFmt(loan.dueDate)}</td>
                      <td>
                        <StatusBadge status={loan.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
