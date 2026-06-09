import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as booksApi from '../api/books';
import { listAuthors } from '../api/authors';
import { listCategories } from '../api/categories';
import { borrowBook } from '../api/loans';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const PAGE_SIZE = 12;

const emptyForm = {
  title: '',
  isbn: '',
  description: '',
  publishedYear: '',
  totalCopies: 1,
  authorId: '',
  categoryId: '',
};

export default function Books() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const isAdmin = user?.role === 'ADMIN';

  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [available, setAvailable] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([listAuthors(), listCategories()])
      .then(([a, c]) => {
        setAuthors(a);
        setCategories(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    if (authorId) params.authorId = authorId;
    if (categoryId) params.categoryId = categoryId;
    if (available) params.available = available;

    booksApi
      .listBooks(params)
      .then((res) => {
        if (cancelled) return;
        setBooks(res.items);
        setPagination(res.pagination);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Failed to load books'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, authorId, categoryId, available]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      title: book.title,
      isbn: book.isbn,
      description: book.description || '',
      publishedYear: book.publishedYear || '',
      totalCopies: book.totalCopies,
      authorId: book.authorId,
      categoryId: book.categoryId || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const reload = () => {
    const params = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    if (authorId) params.authorId = authorId;
    if (categoryId) params.categoryId = categoryId;
    if (available) params.available = available;
    return booksApi.listBooks(params).then((res) => {
      setBooks(res.items);
      setPagination(res.pagination);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        isbn: form.isbn,
        description: form.description || undefined,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
        totalCopies: form.totalCopies ? Number(form.totalCopies) : undefined,
        authorId: Number(form.authorId),
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      };
      if (editing) {
        await booksApi.updateBook(editing.id, payload);
        setNotice('Book updated.');
      } else {
        await booksApi.createBook(payload);
        setNotice('Book created.');
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Failed to save book'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    setError('');
    try {
      await booksApi.deleteBook(book.id);
      setNotice('Book deleted.');
      await reload();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete book'));
    }
  };

  const handleBorrow = async (book) => {
    setError('');
    setNotice('');
    try {
      await borrowBook({ bookId: book.id });
      setNotice(`Borrowed "${book.title}".`);
      await reload();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to borrow book'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Books</h1>
          <p>Browse the library catalog.</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New book
          </button>
        )}
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <div className="filters">
        <input
          placeholder="Search title or ISBN..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          value={authorId}
          onChange={(e) => {
            setPage(1);
            setAuthorId(e.target.value);
          }}
        >
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={available}
          onChange={(e) => {
            setPage(1);
            setAvailable(e.target.value);
          }}
        >
          <option value="">Any availability</option>
          <option value="true">Available now</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <div className="card empty-state">No books found.</div>
      ) : (
        <div className="grid">
          {books.map((book) => (
            <div key={book.id} className="card book-card">
              <h3>
                <Link to={`/books/${book.id}`}>{book.title}</Link>
              </h3>
              <span className="meta">{book.author?.name}</span>
              {book.category && <span className="badge badge-role">{book.category.name}</span>}
              <span className="meta">
                {book.availableCopies} / {book.totalCopies} available
              </span>
              <div className="footer">
                <Link to={`/books/${book.id}`} className="btn btn-secondary btn-sm">
                  View
                </Link>
                <div className="actions-cell">
                  {!isStaff && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={book.availableCopies < 1}
                      onClick={() => handleBorrow(book)}
                    >
                      Borrow
                    </button>
                  )}
                  {isStaff && (
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(book)}>
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(book)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />

      {modalOpen && (
        <Modal title={editing ? 'Edit book' : 'New book'} onClose={() => setModalOpen(false)}>
          <Alert>{formError}</Alert>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="isbn">ISBN</label>
                <input
                  id="isbn"
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="publishedYear">Published year</label>
                <input
                  id="publishedYear"
                  type="number"
                  value={form.publishedYear}
                  onChange={(e) => setForm((f) => ({ ...f, publishedYear: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="authorId">Author</label>
                <select
                  id="authorId"
                  value={form.authorId}
                  onChange={(e) => setForm((f) => ({ ...f, authorId: e.target.value }))}
                  required
                >
                  <option value="">Select author</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="categoryId">Category</label>
                <select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="totalCopies">Total copies</label>
              <input
                id="totalCopies"
                type="number"
                min={editing ? 0 : 1}
                value={form.totalCopies}
                onChange={(e) => setForm((f) => ({ ...f, totalCopies: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
