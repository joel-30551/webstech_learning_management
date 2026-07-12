import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import '../../styles/admin/AccountantsPage.css';

interface Accountant {
  _id: string;
  userId: string;
  accountantId: string;
  fullName: string;
  phone: string;
  residence: string;
  createdAt: string;
}

interface UserAccount {
  _id: string;
  name?: string;
  fullName?: string;
  email?: string;
}

interface AccountantForm {
  userId: string;
  accountantId: string;
  fullName: string;
  phone: string;
  residence: string;
}

const emptyForm: AccountantForm = {
  userId: '',
  accountantId: '',
  fullName: '',
  phone: '',
  residence: '',
};

const AccountantsPage: React.FC = () => {
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Accountant | null>(null);

  const [form, setForm] = useState<AccountantForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [viewProfile, setViewProfile] = useState<Accountant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Accountant | null>(null);
  const [idGenerating, setIdGenerating] = useState(false);

  // Generates the next auto-incremented Accountant ID from a given list of
  // accountants. Must always be called with the FULL, unfiltered list —
  // never with the (possibly search-narrowed) `accountants` state — or it
  // can hand out an ID already taken by a record hidden by the search filter.
  const generateNextAccountantId = (list: Accountant[]): string => {
    const currentYear = new Date().getFullYear();
    const prefix = `ACC-${currentYear}-`;

    let maxNum = 0;
    list.forEach(a => {
      const id = a.accountantId;
      if (!id || !id.startsWith(prefix)) return;
      const match = id.match(/^ACC-\d{4}-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(4, '0');
    return `${prefix}${paddedNum}`;
  };

  const fetchAccountants = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await fetch(`/api/accountants?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();

    setAccountants(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  // Users pulled from the usersaccount collection, used to populate the
  // "Linked User" select when creating/editing an accountant.
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/user-accounts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchAccountants();
  }, [fetchAccountants]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const userLabel = (userId: string): string => {
    const u = users.find(u => u._id === userId);
    if (!u) return userId || '—';
    return u.fullName || u.name || u.email || u._id;
  };

  const openAdd = async () => {
    setEditing(null);
    setFormError('');
    setForm({ ...emptyForm, accountantId: 'Generating...' });
    setShowModal(true);
    setIdGenerating(true);

    try {
      // Always fetch the FULL unfiltered list for ID calculation, regardless
      // of any active search filter on the table, so we always see the true
      // highest existing Accountant ID for the current year.
      const res = await fetch('/api/accountants', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const allAccountants: Accountant[] = Array.isArray(data) ? data : [];
      setForm(f => ({ ...f, accountantId: generateNextAccountantId(allAccountants) }));
    } catch {
      // Fallback: use whatever is already loaded (better than a blank ID)
      setForm(f => ({ ...f, accountantId: generateNextAccountantId(accountants) }));
    } finally {
      setIdGenerating(false);
    }
  };

  const openEdit = (a: Accountant) => {
    setEditing(a);

    setForm({
      userId: a.userId,
      accountantId: a.accountantId,
      fullName: a.fullName,
      phone: a.phone,
      residence: a.residence,
    });

    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const names = (form.fullName || '').trim().split(' ');
    const firstName = names[0] || 'Unknown';
    const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Name';

    // Add default values for required fields that aren't on the form
    const payload: Record<string, unknown> = {
      ...form,
      firstName,
      lastName,
      email: `${form.accountantId.toLowerCase()}@enoshcollege.edu`,
      employeeId: form.accountantId,
      status: 'active'
    };
    // Remove userId if empty to avoid Mongoose CastError on empty string
    if (!payload.userId) delete payload.userId;

    const url = editing
      ? `/api/accountants/${editing._id}`
      : '/api/accountants';

    const method = editing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || 'Operation failed');
        return;
      }

      setShowModal(false);
      fetchAccountants();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await fetch(`/api/accountants/${deleteTarget._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    setDeleteTarget(null);
    fetchAccountants();
  };

  return (
    <div className="mgmt-page">

      {/* HEADER */}
      <div className="mgmt-header">
        <div>
          <h2>Accountants Registry</h2>
          <p>Register, search, and manage accountant records.</p>
        </div>

        <button id='btn' className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Add Accountant
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search accountants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        {loading ? (
          <p className="table-state">Loading accountants...</p>
        ) : accountants.length === 0 ? (
          <p className="table-state">No accountants found.</p>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Accountant ID</th>
                <th>Phone</th>
                <th>Residence</th>
                <th>Linked User</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {accountants.map(a => (
                <tr key={a._id}>
                  <td className="td-name">{a.fullName}</td>
                  <td>{a.accountantId}</td>
                  <td>{a.phone}</td>
                  <td>{a.residence}</td>
                  <td>{userLabel(a.userId)}</td>

                  <td className="td-actions">
                    <button className="action-btn view-btn" onClick={() => setViewProfile(a)}>
                      <BookOpen size={15} />
                    </button>

                    <button className="action-btn edit-btn" onClick={() => openEdit(a)}>
                      <Pencil size={15} />
                    </button>

                    <button className="action-btn delete-btn" onClick={() => setDeleteTarget(a)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h3>{editing ? 'Edit Accountant' : 'Add Accountant'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && <p className="modal-error">{formError}</p>}

            <form className="modal-form" onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Full Name</label>
                <input required value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Residence</label>
                  <input value={form.residence}
                    onChange={e => setForm({ ...form, residence: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Linked User Account</label>
                <select
                  value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })}
                >
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.fullName || u.name || u.email || u._id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Accountant ID</label>
                <input value={form.accountantId} readOnly />
              </div>

              <div className="modal-actions">
                <button type="button" id="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>

                <button id="btn" type="submit" className="btn-submit" disabled={formLoading || idGenerating}>
                  {formLoading ? 'Saving...' : 'Save'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW */}
      {viewProfile && (
        <div className="modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Accountant Profile</h3>
              <button className="modal-close" onClick={() => setViewProfile(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="profile-grid">
              <p><strong>Full Name:</strong> {viewProfile.fullName}</p>
              <p><strong>Accountant ID:</strong> {viewProfile.accountantId}</p>
              <p><strong>Phone:</strong> {viewProfile.phone}</p>
              <p><strong>Residence:</strong> {viewProfile.residence}</p>
              <p><strong>Linked User:</strong> {userLabel(viewProfile.userId)}</p>
              <p><strong>Created At:</strong> {new Date(viewProfile.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Accountant?</h3>
            </div>

            <p>{deleteTarget.fullName}</p>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccountantsPage;