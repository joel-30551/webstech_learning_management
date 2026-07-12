import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Pencil, Trash2, X, ChevronDown, BookOpen,
  Lock, Unlock,
} from 'lucide-react';
import '../../styles/admin/UserAccountsPage.css';

type Role = 'admin' | 'teacher' | 'accountant' | 'student';

interface UserAccount {
  _id: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface UserAccountForm {
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  password: string;
  confirmPassword: string;
}

const emptyForm: UserAccountForm = {
  firstName: '', lastName: '',
  role: 'student', isActive: true,
  password: '', confirmPassword: '',
};

const roleOptions: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'student', label: 'Student' },
];

const roleLabel = (role: Role) =>
  roleOptions.find(r => r.value === role)?.label || role;

const UserAccountPage: React.FC = () => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);

  const [form, setForm] = useState<UserAccountForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [viewProfile, setViewProfile] = useState<UserAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [lockTarget, setLockTarget] = useState<UserAccount | null>(null);
  const [lockLoading, setLockLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterRole) params.append('role', filterRole);
    if (filterActive) params.append('isActive', filterActive);

    try {
      const res = await fetch(`/api/user-accounts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load user accounts:', err);
      setFetchError('Could not load user accounts.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterActive]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const openAdd = () => {
    setEditing(null);
    setFormError('');
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: UserAccount) => {
    setEditing(a);
    setForm({
      firstName: a.firstName, lastName: a.lastName,
      role: a.role, isActive: a.isActive,
      password: '', confirmPassword: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editing) {
      if (!form.password || form.password.length < 8) {
        setFormError('Password must be at least 8 characters.'); return;
      }
      if (form.password !== form.confirmPassword) {
        setFormError('Passwords do not match.'); return;
      }
    } else if (form.password && form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.'); return;
    }

    setFormLoading(true);
    const payload: Record<string, unknown> = {
      firstName: form.firstName, lastName: form.lastName,
      role: form.role, isActive: form.isActive,
    };
    if (form.password) payload.password = form.password;

    const url = editing ? `/api/user-accounts/${editing._id}` : '/api/user-accounts';
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
      if (!res.ok) { setFormError(data.message || 'Operation failed.'); return; }
      setShowModal(false);
      fetchAccounts();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/user-accounts/${deleteTarget._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setDeleteTarget(null);
    fetchAccounts();
  };

  const handleToggleLock = async () => {
    if (!lockTarget) return;
    setLockLoading(true);
    const nextActive = !lockTarget.isActive;
    try {
      await fetch(`/api/user-accounts/${lockTarget._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: nextActive }),
      });
      setLockTarget(null);
      fetchAccounts();
    } finally {
      setLockLoading(false);
    }
  };

  return (
    <div className="mgmt-page">
      <div className="mgmt-header">
        <div>
          <h2>User Accounts Control</h2>
          <p>Manage logins, roles, and access.</p>
        </div>
        <button id="btn" className="btn-add" onClick={openAdd}>
          <Plus size={16} /> New User
        </button>
      </div>

      <div id="toolbar" className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div id="filter" className="filter-group">
          <div className="filter-select">
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              {roleOptions.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
            </select>
            <ChevronDown size={14} />
          </div>
          <div className="filter-select">
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)}>
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      <p className="record-count">{accounts.length} account{accounts.length !== 1 ? 's' : ''} found</p>

      <div className="table-wrapper">
        {loading ? (
          <p className="table-state">Loading user accounts...</p>
        ) : fetchError ? (
          <p className="table-state">{fetchError}</p>
        ) : accounts.length === 0 ? (
          <p className="table-state">No user accounts found. Add one to get started.</p>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a._id}>
                  <td className="td-name">{a.firstName} {a.lastName}</td>
                  <td><span className="badge-exam">{roleLabel(a.role)}</span></td>
                  <td>
                    <span id="selectActive" className={`badge ${a.isActive ? 'badge-green' : 'badge-red'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{a.lastLogin ? new Date(a.lastLogin).toLocaleString() : 'Never'}</td>
                  <td className="td-actions">
                    <button className="action-btn view-btn" title="View profile" onClick={() => setViewProfile(a)}>
                      <BookOpen size={15} />
                    </button>
                    <button
                      className="action-btn lock-btn"
                      title={a.isActive ? 'Deactivate account' : 'Activate account'}
                      onClick={() => setLockTarget(a)}
                    >
                      {a.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                    </button>
                    <button className="action-btn edit-btn" title="Edit" onClick={() => openEdit(a)}>
                      <Pencil size={15} />
                    </button>
                    <button className="action-btn delete-btn" title="Delete" onClick={() => setDeleteTarget(a)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit User Account' : 'Add New User Account'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {formError && <p className="modal-error">{formError}</p>}
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                    {roleOptions.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{editing ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input type="password" required={!editing} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? '••••••••' : 'Min. 8 characters'} />
                </div>
                <div className="form-group">
                  <label>Confirm Password{!editing && ' *'}</label>
                  <input type="password" required={!editing} value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder={editing ? '••••••••' : 'Re-enter password'} />
                </div>
              </div>
              <div className="modal-actions">
                <button id="btn-cancel" type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="btn" type="submit" className="btn-submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editing ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile */}
      {viewProfile && (
        <div className="modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Account Profile</h3>
              <button className="modal-close" onClick={() => setViewProfile(null)}><X size={18} /></button>
            </div>
            <div className="profile-grid">
              <ProfileRow label="Full Name" value={`${viewProfile.firstName} ${viewProfile.lastName}`} />
              <ProfileRow label="Role" value={roleLabel(viewProfile.role)} />
              <ProfileRow label="Status" value={viewProfile.isActive ? 'Active' : 'Inactive'} />
              <ProfileRow label="Last Login" value={viewProfile.lastLogin ? new Date(viewProfile.lastLogin).toLocaleString() : 'Never'} />
              <ProfileRow label="Account Created" value={viewProfile.createdAt ? new Date(viewProfile.createdAt).toLocaleDateString() : '—'} />
            </div>
          </div>
        </div>
      )}

      {/* Lock / Unlock Confirmation */}
      {lockTarget && (
        <div className="modal-overlay" onClick={() => setLockTarget(null)}>
          <div className="modal-box confirm-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{lockTarget.isActive ? 'Deactivate Account' : 'Activate Account'}</h3>
              <button className="modal-close" onClick={() => setLockTarget(null)}><X size={18} /></button>
            </div>
            <p className="confirm-text">
              {lockTarget.isActive
                ? <>Immediately block <strong>{lockTarget.firstName} {lockTarget.lastName}</strong> from logging in?</>
                : <>Restore login access for <strong>{lockTarget.firstName} {lockTarget.lastName}</strong>?</>}
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setLockTarget(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={handleToggleLock} disabled={lockLoading}>
                {lockLoading ? 'Working...' : lockTarget.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box confirm-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <p className="confirm-text">
              Are you sure you want to permanently delete the login for{' '}
              <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="profile-row">
    <span className="profile-label">{label}</span>
    <span className="profile-value">{value}</span>
  </div>
);

export default UserAccountPage;