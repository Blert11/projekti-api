import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as booksApi from '../api/books';
import { borrowBook } from '../api/loans';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    booksApi
      .getBook(id)
      .then(setBook)
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load book')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleBorrow = async () => {
    setError('');
    setNotice('');
    try {
      await borrowBook({ bookId: book.id });
      setNotice('Book borrowed successfully.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to borrow book'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    try {
      await booksApi.deleteBook(book.id);
      navigate('/books');
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete book'));
    }
  };

  if (loading) return <Spinner />;
  if (error && !book) return <Alert>{error}</Alert>;
  if (!book) return null;

  return (
    <div>
      <Link to="/books" className="link-btn">
        &larr; Back to books
      </Link>

      <div className="page-header" style={{ marginTop: '1rem' }}>
        <div>
          <h1>{book.title}</h1>
          <p>
            by{' '}
            {book.author ? (
              <Link to={`/authors`}>{book.author.name}</Link>
            ) : (
              'Unknown author'
            )}
            {book.category && <> &middot; {book.category.name}</>}
          </p>
        </div>
        {user?.role === 'MEMBER' && (
          <button className="btn btn-primary" disabled={book.availableCopies < 1} onClick={handleBorrow}>
            {book.availableCopies < 1 ? 'No copies available' : 'Borrow this book'}
          </button>
        )}
        {isAdmin && (
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete book
          </button>
        )}
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="card">
        {book.description && <p>{book.description}</p>}
        <div className="stats-grid" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <div className="stat-card">
            <span className="stat-value">{book.isbn}</span>
            <span className="stat-label">ISBN</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{book.publishedYear || '—'}</span>
            <span className="stat-label">Published</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {book.availableCopies} / {book.totalCopies}
            </span>
            <span className="stat-label">Available / Total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
