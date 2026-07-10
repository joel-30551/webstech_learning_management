import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import '../../styles/admin/TeachersPage.css';

interface Teacher {
  _id: string;
  userId: string;
  teacherId: string;
  fullName: string;
  subject: string;
  phone: string;
  residence: string;
  createdAt?: string;
}

interface UserAccount {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

interface TeacherForm {
  userId: string;
  teacherId: string;
  fullName: string;
  subject: string;
  phone: string;
  residence: string;
}

const emptyForm: TeacherForm = {
  userId: '',
  teacherId: '',
  fullName: '',
  subject: '',
  phone: '',
  residence: '',
};

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [viewProfile, setViewProfile] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [idGenerating, setIdGenerating] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    try {
      const res = await fetch(`/api/teachers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Users pulled from the user accounts collection, used to populate the
  // "Linked User" select when creating/editing a teacher.
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
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const userLabel = (userId: string): string => {
    const u = users.find(u => u._id === userId);
    if (!u) return userId || '—';
    return u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u._id;
  };

  // Generates the next auto-incremented Teacher ID from a given list of
  // teachers. Must always be called with the FULL, unfiltered list — never
  // with the (possibly search-narrowed) `teachers` state — or it can hand
  // out an ID already taken by a record hidden by the search filter.
  const generateNextTeacherId = (list: Teacher[]): string => {
    const currentYear = new Date().getFullYear();
    const prefix = `ECT-${currentYear}-`; // ECT: Enosh College Teacher

    let maxNum = 0;
    list.forEach(t => {
      const id = t.teacherId;
      if (!id || !id.startsWith(prefix)) return;
      const match = id.match(/^ECT-\d{4}-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(4, '0');
    return `${prefix}${paddedNum}`;
  };

  const openAdd = async () => {
    setEditing(null);
    setFormError('');
    setForm({ ...emptyForm, teacherId: 'Generating...' });
    setShowModal(true);
    setIdGenerating(true);

    try {
      // Always fetch the FULL unfiltered list for ID calculation, regardless
      // of any active search filter on the table, so we always see the true
      // highest existing Teacher ID for the current year.
      const res = await fetch('/api/teachers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const allTeachers: Teacher[] = Array.isArray(data) ? data : [];
      setForm(f => ({ ...f, teacherId: generateNextTeacherId(allTeachers) }));
    } catch {
      // Fallback: use whatever is already loaded (better than a blank ID)
      setForm(f => ({ ...f, teacherId: generateNextTeacherId(teachers) }));
    } finally {
      setIdGenerating(false);
    }
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      userId: t.userId,
      teacherId: t.teacherId,
      fullName: t.fullName,
      subject: t.subject,
      phone: t.phone || '',
      residence: t.residence || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const names = (form.fullName || '').trim().split(' ');
    const firstName = names[0] || 'Unknown';
    const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Name';
    
    // Add default values for required fields that aren't on the form
    const payload = { 
      ...form, 
      firstName,
      lastName,
      email: `${form.teacherId.toLowerCase()}@enoshcollege.edu`,
      employeeId: form.teacherId,
      status: 'active'
    };

    const url = editing ? `/api/teachers/${editing._id}` : '/api/teachers';
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
        setFormError(data.message || 'Operation failed.');
        return;
      }
      setShowModal(false);
      fetchTeachers();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/teachers/${deleteTarget._id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        console.error('Delete failed');
      }
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
    fetchTeachers();
  };

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>Teachers Registry</h2>
          <p>Register, search, and manage teacher profiles.</p>
        </div>
        <button id="btn" className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {/* Toolbar */}
      <div className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by name, teacher ID, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Count */}
      <p className="record-count">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="table-state">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="table-state">No teachers found. Add one to get started.</p>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Teacher ID</th>
                <th>Subject</th>
                <th>Phone</th>
                <th>Residence</th>
                <th>Linked User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t._id}>
                  <td className="td-name">{t.fullName}</td>
                  <td>{t.teacherId}</td>
                  <td>{t.subject}</td>
                  <td>{t.phone || '—'}</td>
                  <td>{t.residence || '—'}</td>
                  <td>{userLabel(t.userId)}</td>
                  <td className="td-actions">
                    <button className="action-btn view-btn" title="View profile" onClick={() => setViewProfile(t)}>
                      <BookOpen size={15} />
                    </button>
                    <button className="action-btn edit-btn" title="Edit" onClick={() => openEdit(t)}>
                      <Pencil size={15} />
                    </button>
                    <button className="action-btn delete-btn" title="Delete" onClick={() => setDeleteTarget(t)}>
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
          <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {formError && <p className="modal-error">{formError}</p>}
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Teacher ID * (Auto-generated)</label>
                  <input required readOnly value={form.teacherId} className="input-readonly" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics, Physics" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Residence</label>
                  <input value={form.residence} onChange={e => setForm({ ...form, residence: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Linked User Account</label>
                  <select
                    required
                    value={form.userId}
                    onChange={e => setForm({ ...form, userId: e.target.value })}
                  >
                    <option value="">Select a user...</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u._id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button  type="button" id="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="btn" type="submit" className="btn-submit" disabled={formLoading || idGenerating}>
                  {formLoading ? 'Saving...' : editing ? 'Save Changes' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewProfile && (
        <div className="modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Teacher Profile</h3>
              <button className="modal-close" onClick={() => setViewProfile(null)}><X size={18} /></button>
            </div>
            <div className="profile-grid">
              <ProfileRow label="Full Name" value={viewProfile.fullName} />
              <ProfileRow label="Teacher ID" value={viewProfile.teacherId} />
              <ProfileRow label="Subject" value={viewProfile.subject} />
              <ProfileRow label="Phone" value={viewProfile.phone || '—'} />
              <ProfileRow label="Residence" value={viewProfile.residence || '—'} />
              <ProfileRow label="Linked User" value={userLabel(viewProfile.userId)} />
              <ProfileRow label="Created At" value={viewProfile.createdAt ? new Date(viewProfile.createdAt).toLocaleString() : '—'} />
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
              Are you sure you want to delete teacher <strong>{deleteTarget.fullName}</strong>? This cannot be undone.
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

export default TeachersPage;