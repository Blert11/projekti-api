import { useEffect, useState } from 'react';
import * as authorsApi from '../api/authors';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';

const emptyForm = { name: '', bio: '' };

export default function Authors() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const isAdmin = user?.role === 'ADMIN';

  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    authorsApi
      .listAuthors()
      .then(setAuthors)
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load authors')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (author) => {
    setEditing(author);
    setForm({ name: author.name, bio: author.bio || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { name: form.name, bio: form.bio || undefined };
      if (editing) {
        await authorsApi.updateAuthor(editing.id, payload);
        setNotice('Author updated.');
      } else {
        await authorsApi.createAuthor(payload);
        setNotice('Author created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Failed to save author'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (author) => {
    if (!window.confirm(`Delete "${author.name}"?`)) return;
    setError('');
    try {
      await authorsApi.deleteAuthor(author.id);
      setNotice('Author deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete author'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Authors</h1>
          <p>Authors in the catalog.</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New author
          </button>
        )}
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      {loading ? (
        <Spinner />
      ) : authors.length === 0 ? (
        <div className="card empty-state">No authors yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Bio</th>
                {isStaff && <th className="actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id}>
                  <td>{author.name}</td>
                  <td style={{ whiteSpace: 'normal' }}>{author.bio || '—'}</td>
                  {isStaff && (
                    <td className="actions">
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(author)}>
                          Edit
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(author)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit author' : 'New author'} onClose={() => setModalOpen(false)}>
          <Alert>{formError}</Alert>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
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
