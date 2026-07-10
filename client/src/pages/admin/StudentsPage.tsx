import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, X, ChevronDown, BookOpen } from 'lucide-react';
import '../../styles/admin/StudentsPage.css';

interface Student {
  _id: string;
  userId: string;
  studentId: string;
  fullName: string;
  dob: string;
  class: string;
  course: string;
  residence: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  status: 'active' | 'inactive' | 'graduated';
  examType: 'WASSCE' | 'NOVDEC';
  guardianName: string;
  guardianPhone: string;
  createdAt?: string;
}

interface UserAccount {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

interface StudentForm {
  userId: string;
  studentId: string;
  fullName: string;
  dob: string;
  class: string;
  course: string;
  residence: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  status: 'active' | 'inactive' | 'graduated';
  examType: 'WASSCE' | 'NOVDEC';
  guardianName: string;
  guardianPhone: string;
}

const emptyForm: StudentForm = {
  userId: '', studentId: '', fullName: '', dob: '',
  class: '', course: '', residence: '', phone: '',
  gender: 'male',
  status: 'active', examType: 'WASSCE',
  guardianName: '', guardianPhone: '',
};

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [viewProfile, setViewProfile] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [idGenerating, setIdGenerating] = useState(false);

  // hardcoded list of fixed class levels
  const availableClasses = ['SHS 1', 'SHS 2', 'SHS 3'];

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterStatus) params.append('status', filterStatus);
    if (filterClass) params.append('class', filterClass);
    if (filterExamType) params.append('examType', filterExamType);
    if (filterGender) params.append('gender', filterGender);
    const res = await fetch(`/api/students?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, filterStatus, filterClass, filterExamType, filterGender]);

  // Users pulled from the user accounts collection, used to populate the
  // "Linked User" select when creating/editing a student.
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

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const userLabel = (userId: string): string => {
    const u = users.find(u => u._id === userId);
    if (!u) return userId || '—';
    return u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u._id;
  };

  // Helper to generate the next auto-incremented ID from a given list of students.
  // IMPORTANT: this must be called with the FULL, unfiltered student list —
  // never with the (possibly search/filter-narrowed) `students` state directly,
  // or it can hand out an ID that's already taken by a student hidden by filters.
  const generateNextStudentId = (list: Student[]): string => {
    const currentYear = new Date().getFullYear();
    const prefix = `ECS-${currentYear}-`;

    let maxNum = 0;
    list.forEach(s => {
      const id = s.studentId;
      if (!id || !id.startsWith(prefix)) return;
      const match = id.match(/^ECS-\d{4}-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    // Pad to 4 digits (e.g., 0001)
    const paddedNum = String(nextNum).padStart(4, '0');
    return `${prefix}${paddedNum}`;
  };

  const openAdd = async () => {
    setEditing(null);
    setFormError('');
    setForm({ ...emptyForm, studentId: 'Generating...' });
    setShowModal(true);
    setIdGenerating(true);

    try {
      // Always fetch the FULL unfiltered list for ID calculation, regardless
      // of any active search/filter on the table, so we always see the true
      // highest existing ID for the current year.
      const res = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const allStudents: Student[] = Array.isArray(data) ? data : [];
      setForm(f => ({ ...f, studentId: generateNextStudentId(allStudents) }));
    } catch {
      // Fallback: use whatever is already loaded (better than a blank ID)
      setForm(f => ({ ...f, studentId: generateNextStudentId(students) }));
    } finally {
      setIdGenerating(false);
    }
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      userId: s.userId,
      studentId: s.studentId,
      fullName: s.fullName,
      dob: s.dob ? s.dob.slice(0, 10) : '',
      class: s.class,
      course: s.course,
      residence: s.residence,
      phone: s.phone,
      gender: s.gender,
      status: s.status,
      examType: s.examType || 'WASSCE',
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
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
    
    // Add default values for required fields that aren't on the form but required by backend
    const payload = { 
      ...form, 
      firstName,
      lastName,
      email: `${form.studentId.toLowerCase()}@student.enoshcollege.edu`,
      dateOfBirth: form.dob,
      classLevel: form.class,
      program: form.course
    };

    const url = editing ? `/api/students/${editing._id}` : '/api/students';
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
      fetchStudents();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/students/${deleteTarget._id}`, { 
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setDeleteTarget(null);
    fetchStudents();
  };

  return (
    <div className="mgmt-page">
      
      <div className="mgmt-header">
        <div>
          <h2>Students Registry</h2>
          <p>Register, search, and manage student records.</p>
        </div>
        <button id="btn" className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Toolbar */}
      <div className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by name, student ID, course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div id="filter" className="filter-group">
          <div className="filter-select">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
            <ChevronDown size={14} />
          </div>
          <div className="filter-select">
            <select value={filterExamType} onChange={e => setFilterExamType(e.target.value)}>
              <option value="">All Exams</option>
              <option value="WASSCE">WASSCE</option>
              <option value="NOVDEC">NOVDEC</option>
            </select>
            <ChevronDown size={14} />
          </div>
          <div className="filter-select">
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="">All Classes</option>
              {availableClasses.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            <ChevronDown size={14} />
          </div>
          <div className="filter-select">
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="record-count">{students.length} student{students.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="table-state">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="table-state">No students found. Add one to get started.</p>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Class</th>
                <th>Exam Type</th>
                <th>Course</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td className="td-name">{s.fullName}</td>
                  <td>{s.studentId}</td>
                  <td>{s.class}</td>
                  <td><span className="badge-exam">{s.examType || 'WASSCE'}</span></td>
                  <td>{s.course || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td className="capitalize">{s.gender}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'graduated' ? 'badge-blue' : 'badge-grey'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="action-btn view-btn" title="View profile" onClick={() => setViewProfile(s)}>
                      <BookOpen size={15} />
                    </button>
                    <button className="action-btn edit-btn" title="Edit" onClick={() => openEdit(s)}>
                      <Pencil size={15} />
                    </button>
                    <button className="action-btn delete-btn" title="Delete" onClick={() => setDeleteTarget(s)}>
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
              <h3>{editing ? 'Edit Student' : 'Add New Student'}</h3>
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
                  <label>Student ID * (Auto-generated)</label>
                  <input
                    required
                    readOnly
                    value={form.studentId}
                    onChange={e => setForm({ ...form, studentId: e.target.value })}
                    className="input-readonly"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class Level *</label>
                  <select required value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                    <option value="">Select Class...</option>
                    {availableClasses.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Course</label>
                  <input value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="e.g. Science, Business" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" required value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
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
                  <label>Gender *</label>
                  <select required value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'male' | 'female' | 'other' })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Exam Type *</label>
                  <select required value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value as 'WASSCE' | 'NOVDEC' })}>
                    <option value="WASSCE">WASSCE</option>
                    <option value="NOVDEC">NOVDEC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' | 'graduated' })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                  </select>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Guardian Name</label>
                  <input value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Guardian Phone</label>
                  <input value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button id="btn-cancel" type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="btn" type="submit" className="btn-submit" disabled={formLoading || idGenerating}>
                  {formLoading ? 'Saving...' : editing ? 'Save Changes' : 'Add Student'}
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
              <h3>Student Profile</h3>
              <button className="modal-close" onClick={() => setViewProfile(null)}><X size={18} /></button>
            </div>
            <div className="profile-grid">
              <ProfileRow label="Full Name" value={viewProfile.fullName} />
              <ProfileRow label="Student ID" value={viewProfile.studentId} />
              <ProfileRow label="Class Level" value={viewProfile.class} />
              <ProfileRow label="Exam Type" value={viewProfile.examType || 'WASSCE'} />
              <ProfileRow label="Course" value={viewProfile.course || '—'} />
              <ProfileRow label="Phone" value={viewProfile.phone || '—'} />
              <ProfileRow label="Residence" value={viewProfile.residence || '—'} />
              <ProfileRow label="Gender" value={viewProfile.gender} />
              <ProfileRow label="Date of Birth" value={viewProfile.dob ? new Date(viewProfile.dob).toLocaleDateString() : '—'} />
              <ProfileRow label="Guardian" value={viewProfile.guardianName || '—'} />
              <ProfileRow label="Guardian Phone" value={viewProfile.guardianPhone || '—'} />
              <ProfileRow label="Status" value={viewProfile.status} />
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
              Are you sure you want to delete <strong>{deleteTarget.fullName}</strong>? This cannot be undone.
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

export default StudentsPage;