import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, AlertCircle, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';
import './StudentAccountPage.css';

type FeeStatus = 'paid' | 'partial' | 'unpaid';

interface Fee {
  _id: string;
  studentId: string;
  class: string;
  term: string;
  academicYear: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  paymentMethod: string;
  receivedBy: string;
  createdAt?: string;
}

const currency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 2,
});
const formatMoney = (n: number): string => currency.format(n || 0);

const statusIcon = (status: FeeStatus) => {
  if (status === 'paid') return <CheckCircle2 size={16} />;
  if (status === 'partial') return <Clock size={16} />;
  return <XCircle size={16} />;
};

const StudentAccountPage: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Read-only: fee records are entered and managed exclusively by
  // accountants. A student can only view their own billing history here.
  const fetchMyFees = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/fees/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const list: Fee[] = Array.isArray(data) ? data : [];
      // Most recent first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setFees(list);
    } catch (err) {
      console.error('Failed to load fee records:', err);
      setFetchError('Could not load your fee records. Check that /api/fees/me is reachable.');
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyFees(); }, [fetchMyFees]);

  const current = fees[0] || null;

  const totals = useMemo(() => ({
    totalBilled: fees.reduce((sum, f) => sum + (f.totalFee || 0), 0),
    totalPaid: fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0),
    totalOutstanding: fees.reduce((sum, f) => sum + (f.balance || 0), 0),
  }), [fees]);

  if (loading) {
    return (
      <div className="mgmt-page">
        <p style={{ textAlign: 'center', marginTop: 40 }}>Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>My Account</h2>
          <p>Your fee billing and payment history, as recorded by the accounts office.</p>
        </div>
      </div>

      {fetchError && (
        <div className="alert alert-warning">
          <AlertCircle size={18} />
          {fetchError}
        </div>
      )}

      {!fetchError && fees.length === 0 ? (
        <p className="table-state">No fee records have been added for you yet.</p>
      ) : !fetchError && (
        <>
          {/* Current standing */}
          {current && (
            <div className="fees-summary">
              <div className="fees-summary-card">
                <span className="fees-summary-label">Current Term</span>
                <span className="fees-summary-value">{current.term} · {current.academicYear}</span>
              </div>
              <div className="fees-summary-card">
                <span className="fees-summary-label">Amount Paid</span>
                <span className="fees-summary-value text-green">{formatMoney(current.amountPaid)}</span>
              </div>
              <div className="fees-summary-card">
                <span className="fees-summary-label">Outstanding Balance</span>
                <span className="fees-summary-value text-red">{formatMoney(current.balance)}</span>
              </div>
              <div className="fees-summary-card">
                <span className="fees-summary-label">Status</span>
                <span className={`badge ${current.status === 'paid' ? 'badge-green' : current.status === 'partial' ? 'badge-blue' : 'badge-red'}`}>
                  {statusIcon(current.status)} {current.status}
                </span>
              </div>
            </div>
          )}

          {/* Lifetime totals */}
          <div className="fees-summary" style={{ marginTop: 10 }}>
            <div className="fees-summary-card">
              <span className="fees-summary-label">Total Billed (All Terms)</span>
              <span className="fees-summary-value">{formatMoney(totals.totalBilled)}</span>
            </div>
            <div className="fees-summary-card">
              <span className="fees-summary-label">Total Paid (All Terms)</span>
              <span className="fees-summary-value text-green">{formatMoney(totals.totalPaid)}</span>
            </div>
            <div className="fees-summary-card">
              <span className="fees-summary-label">Total Outstanding</span>
              <span className="fees-summary-value text-red">{formatMoney(totals.totalOutstanding)}</span>
            </div>
          </div>

          {/* History table */}
          <div className="table-wrapper" style={{ marginTop: 20 }}>
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Academic Year</th>
                  <th>Class</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Received By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f._id}>
                    <td>{f.term}</td>
                    <td>{f.academicYear}</td>
                    <td>{f.class}</td>
                    <td>{formatMoney(f.totalFee)}</td>
                    <td>{formatMoney(f.amountPaid)}</td>
                    <td>{formatMoney(f.balance)}</td>
                    <td>
                      <span className={`badge ${f.status === 'paid' ? 'badge-green' : f.status === 'partial' ? 'badge-blue' : 'badge-red'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>{f.paymentMethod || '—'}</td>
                    <td>{f.receivedBy || '—'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="field-hint" style={{ marginTop: 12 }}>
            <Wallet size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
            These records are entered and updated by the accounts office. If you notice a discrepancy, please contact an accountant directly.
          </p>
        </>
      )}
    </div>
  );
};

export default StudentAccountPage;