import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Pencil, Trash2, X, ChevronDown, BookOpen, Wallet,
} from 'lucide-react';
import "../../styles/accountant/AccountsPage.css"


type Term = 'First Term' | 'Second Term' | 'Third Term';
type FeeStatus = 'paid' | 'partial' | 'unpaid';
type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque';

interface Fee {
  _id: string;
  studentId: string;
  class: string;
  term: Term;
  academicYear: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  paymentMethod: PaymentMethod;
  receivedBy: string;
  createdAt?: string;
}

interface StudentRef {
  _id: string;
  studentId: string;
  fullName: string;
  class: string;
}

interface FeeForm {
  studentId: string;
  class: string;
  term: Term;
  academicYear: string;
  totalFee: string;
  amountPaid: string;
  paymentMethod: PaymentMethod;
  receivedBy: string;
}

const currentAcademicYear = (() => {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
})();

const emptyForm: FeeForm = {
  studentId: '',
  class: '',
  term: 'First Term',
  academicYear: currentAcademicYear,
  totalFee: '',
  amountPaid: '',
  paymentMethod: 'Cash',
  receivedBy: '',
};

const termOptions: Term[] = ['First Term', 'Second Term', 'Third Term'];
const paymentMethodOptions: PaymentMethod[] = ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'];

const currency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 2,
});

const formatMoney = (n: number): string => currency.format(n || 0);

// Derives status from totalFee/amountPaid so it always stays consistent,
// even though `status` is also stored on the record.
const deriveStatus = (totalFee: number, amountPaid: number): FeeStatus => {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= totalFee) return 'paid';
  return 'partial';
};

const AccountsPage: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<StudentRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [form, setForm] = useState<FeeForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [viewProfile, setViewProfile] = useState<Fee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fee | null>(null);

  const [payTarget, setPayTarget] = useState<Fee | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payReceivedBy, setPayReceivedBy] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Hardcoded list of fixed class levels, matching the Students registry.
  const availableClasses = ['SHS 1', 'SHS 2', 'SHS 3'];

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterStatus) params.append('status', filterStatus);
    if (filterTerm) params.append('term', filterTerm);
    if (filterClass) params.append('class', filterClass);

    try {
      const res = await fetch(`/api/fees?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setFees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load fees:', err);
      setFetchError('Could not load fee records. Check that /api/fees exists and is reachable.');
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterTerm, filterClass]);

  // Students pulled from the Student collection, used to populate the
  // "Student" select when creating/editing a fee record.
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      setStudents([]);
    }
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const studentLabel = (studentId: string): string => {
    const s = students.find(s => s._id === studentId);
    if (!s) return studentId || '—';
    return `${s.fullName} (${s.studentId})`;
  };

  const openAdd = () => {
    setEditing(null);
    setFormError('');
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (f: Fee) => {
    setEditing(f);
    setForm({
      studentId: f.studentId,
      class: f.class,
      term: f.term,
      academicYear: f.academicYear,
      totalFee: String(f.totalFee),
      amountPaid: String(f.amountPaid),
      paymentMethod: f.paymentMethod,
      receivedBy: f.receivedBy,
    });
    setFormError('');
    setShowModal(true);
  };

  // When a student is picked, auto-fill class from their record — it stays
  // editable in case a student needs to be billed under a different class.
  const handleStudentSelect = (studentId: string) => {
    const s = students.find(s => s._id === studentId);
    setForm(f => ({ ...f, studentId, class: s ? s.class : f.class }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const totalFee = parseFloat(form.totalFee);
    const amountPaid = parseFloat(form.amountPaid || '0');

    if (!form.studentId) { setFormError('Please select a student.'); return; }
    if (isNaN(totalFee) || totalFee < 0) { setFormError('Please enter a valid total fee.'); return; }
    if (isNaN(amountPaid) || amountPaid < 0) { setFormError('Please enter a valid amount paid.'); return; }
    if (amountPaid > totalFee) { setFormError('Amount paid cannot exceed the total fee.'); return; }

    setFormLoading(true);

    const payload = {
      studentId: form.studentId,
      class: form.class,
      term: form.term,
      academicYear: form.academicYear,
      totalFee,
      amountPaid,
      balance: totalFee - amountPaid,
      status: deriveStatus(totalFee, amountPaid),
      paymentMethod: form.paymentMethod,
      receivedBy: form.receivedBy,
    };

    const url = editing ? `/api/fees/${editing._id}` : '/api/fees';
    const method = editing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || 'Operation failed.'); return; }
      setShowModal(false);
      fetchFees();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/fees/${deleteTarget._id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchFees();
  };

  const openPay = (f: Fee) => {
    setPayTarget(f);
    setPayAmount('');
    setPayMethod(f.paymentMethod);
    setPayReceivedBy(f.receivedBy);
    setPayError('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    setPayError('');

    const extra = parseFloat(payAmount);
    if (isNaN(extra) || extra <= 0) { setPayError('Enter a valid payment amount.'); return; }
    if (extra > payTarget.balance) { setPayError('Payment exceeds the outstanding balance.'); return; }
    if (!payReceivedBy.trim()) { setPayError('Please enter who received this payment.'); return; }

    const newAmountPaid = payTarget.amountPaid + extra;

    setPayLoading(true);
    try {
      const res = await fetch(`/api/fees/${payTarget._id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: newAmountPaid,
          balance: payTarget.totalFee - newAmountPaid,
          status: deriveStatus(payTarget.totalFee, newAmountPaid),
          paymentMethod: payMethod,
          receivedBy: payReceivedBy,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.message || 'Failed to record payment.'); return; }
      setPayTarget(null);
      fetchFees();
    } catch {
      setPayError('Network error. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  const totalOutstanding = fees.reduce((sum, f) => sum + (f.balance || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>Fees & Accounts</h2>
          <p>Track student fee billing, payments, and outstanding balances.</p>
        </div>
        <button className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Add Fee Record
        </button>
      </div>

      {/* Summary */}
      <div className="fees-summary">
        <div className="fees-summary-card">
          <span className="fees-summary-label">Total Collected</span>
          <span className="fees-summary-value text-green">{formatMoney(totalCollected)}</span>
        </div>
        <div className="fees-summary-card">
          <span className="fees-summary-label">Total Outstanding</span>
          <span className="fees-summary-value text-red">{formatMoney(totalOutstanding)}</span>
        </div>
        <div className="fees-summary-card">
          <span className="fees-summary-label">Records</span>
          <span className="fees-summary-value">{fees.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by student name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-select">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <ChevronDown size={14} />
          </div>
          <div className="filter-select">
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
              <option value="">All Terms</option>
              {termOptions.map(t => (<option key={t} value={t}>{t}</option>))}
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
        </div>
      </div>

      <p className="record-count">{fees.length} fee record{fees.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="table-state">Loading fee records...</p>
        ) : fetchError ? (
          <p className="table-state">{fetchError}</p>
        ) : fees.length === 0 ? (
          <p className="table-state">No fee records found. Add one to get started.</p>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Term</th>
                <th>Academic Year</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => (
                <tr key={f._id}>
                  <td className="td-name">{studentLabel(f.studentId)}</td>
                  <td>{f.class}</td>
                  <td>{f.term}</td>
                  <td>{f.academicYear}</td>
                  <td>{formatMoney(f.totalFee)}</td>
                  <td>{formatMoney(f.amountPaid)}</td>
                  <td>{formatMoney(f.balance)}</td>
                  <td>
                    <span className={`badge ${f.status === 'paid' ? 'badge-green' : f.status === 'partial' ? 'badge-blue' : 'badge-red'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="action-btn view-btn" title="View details" onClick={() => setViewProfile(f)}>
                      <BookOpen size={15} />
                    </button>
                    <button
                      className="action-btn pay-btn"
                      title="Record payment"
                      onClick={() => openPay(f)}
                      disabled={f.status === 'paid'}
                    >
                      <Wallet size={15} />
                    </button>
                    <button className="action-btn edit-btn" title="Edit" onClick={() => openEdit(f)}>
                      <Pencil size={15} />
                    </button>
                    <button className="action-btn delete-btn" title="Delete" onClick={() => setDeleteTarget(f)}>
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
              <h3>{editing ? 'Edit Fee Record' : 'Add New Fee Record'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {formError && <p className="modal-error">{formError}</p>}
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Student *</label>
                  <select
                    required
                    value={form.studentId}
                    onChange={e => handleStudentSelect(e.target.value)}
                  >
                    <option value="">Select a student...</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.fullName} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Class *</label>
                  <select required value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                    <option value="">Select Class...</option>
                    {availableClasses.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Term *</label>
                  <select required value={form.term} onChange={e => setForm({ ...form, term: e.target.value as Term })}>
                    {termOptions.map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Academic Year *</label>
                  <input
                    required
                    value={form.academicYear}
                    onChange={e => setForm({ ...form, academicYear: e.target.value })}
                    placeholder="e.g. 2025/2026"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Fee (GHS) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalFee}
                    onChange={e => setForm({ ...form, totalFee: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Amount Paid (GHS)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amountPaid}
                    onChange={e => setForm({ ...form, amountPaid: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
                    {paymentMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Received By</label>
                  <input
                    value={form.receivedBy}
                    onChange={e => setForm({ ...form, receivedBy: e.target.value })}
                    placeholder="Accountant name"
                  />
                </div>
              </div>

              {form.totalFee && (
                <p className="field-hint">
                  Balance: {formatMoney((parseFloat(form.totalFee) || 0) - (parseFloat(form.amountPaid) || 0))}
                  {' · '}Status: {deriveStatus(parseFloat(form.totalFee) || 0, parseFloat(form.amountPaid) || 0)}
                </p>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editing ? 'Save Changes' : 'Add Fee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payTarget && (
        <div className="modal-overlay" onClick={() => setPayTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="modal-close" onClick={() => setPayTarget(null)}><X size={18} /></button>
            </div>
            {payError && <p className="modal-error">{payError}</p>}
            <form className="modal-form" onSubmit={handleRecordPayment}>
              <p className="field-hint">
                {studentLabel(payTarget.studentId)} — outstanding balance: <strong>{formatMoney(payTarget.balance)}</strong>
              </p>

              <div className="form-group">
                <label>Payment Amount (GHS) *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)}>
                    {paymentMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Received By *</label>
                  <input
                    required
                    value={payReceivedBy}
                    onChange={e => setPayReceivedBy(e.target.value)}
                    placeholder="Accountant name"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setPayTarget(null)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={payLoading}>
                  {payLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewProfile && (
        <div className="modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Fee Record Details</h3>
              <button className="modal-close" onClick={() => setViewProfile(null)}><X size={18} /></button>
            </div>
            <div className="profile-grid">
              <ProfileRow label="Student" value={studentLabel(viewProfile.studentId)} />
              <ProfileRow label="Class" value={viewProfile.class} />
              <ProfileRow label="Term" value={viewProfile.term} />
              <ProfileRow label="Academic Year" value={viewProfile.academicYear} />
              <ProfileRow label="Total Fee" value={formatMoney(viewProfile.totalFee)} />
              <ProfileRow label="Amount Paid" value={formatMoney(viewProfile.amountPaid)} />
              <ProfileRow label="Balance" value={formatMoney(viewProfile.balance)} />
              <ProfileRow label="Status" value={viewProfile.status} />
              <ProfileRow label="Payment Method" value={viewProfile.paymentMethod} />
              <ProfileRow label="Received By" value={viewProfile.receivedBy || '—'} />
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
              Are you sure you want to delete the fee record for{' '}
              <strong>{studentLabel(deleteTarget.studentId)}</strong> ({deleteTarget.term}, {deleteTarget.academicYear})?
              This cannot be undone.
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

export default AccountsPage;