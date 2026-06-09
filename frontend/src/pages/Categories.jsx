import { useEffect, useState } from 'react';
import * as categoriesApi from '../api/categories';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';

export default function Categories() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const isAdmin = user?.role === 'ADMIN';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    categoriesApi
      .listCategories()
      .then(setCategories)
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load categories')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setName(category.name);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.updateCategory(editing.id, { name });
        setNotice('Category updated.');
      } else {
        await categoriesApi.createCategory({ name });
        setNotice('Category created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Failed to save category'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    setError('');
    try {
      await categoriesApi.deleteCategory(category.id);
      setNotice('Category deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete category'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Book categories.</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New category
          </button>
        )}
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      {loading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <div className="card empty-state">No categories yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {isStaff && <th className="actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  {isStaff && (
                    <td className="actions">
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(category)}>
                          Edit
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(category)}>
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
        <Modal title={editing ? 'Edit category' : 'New category'} onClose={() => setModalOpen(false)}>
          <Alert>{formError}</Alert>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="categoryName">Name</label>
              <input id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required />
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
