import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, FileText, Download, Eye } from 'lucide-react';
import './StudentLearnMat.css';

interface LearningMaterial {
  _id: string;
  title: string;
  subject: string;
  class: string;
  description: string;
  fileUrl: string;
  publicId: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy: string;
  createdAt: string;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StudentLearningMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // Read-only: materials are uploaded and managed exclusively by teachers
  // and admins. The backend scopes results to this student's own class
  // (plus anything marked "All Classes") so they only see what's relevant.
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterSubject) params.append('subject', filterSubject);

    try {
      const res = await fetch(`/api/learning-materials/me?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const list: LearningMaterial[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setMaterials(list);
    } catch (err) {
      console.error('Failed to load learning materials:', err);
      setFetchError('Could not load learning materials. Check that /api/learning-materials/me is reachable.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterSubject]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  // Distinct subject list built from whatever's already loaded, so the
  // filter dropdown reflects real data instead of a hardcoded list.
  const subjectOptions = Array.from(new Set(materials.map(m => m.subject).filter(Boolean))).sort();

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>Learning Materials</h2>
          <p>Notes, slides, and resources shared by your teachers.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by title, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-select">
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjectOptions.map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="record-count">{materials.length} material{materials.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="table-state">Loading learning materials...</p>
        ) : fetchError ? (
          <p className="table-state table-state-error">{fetchError}</p>
        ) : materials.length === 0 ? (
          <p className="table-state">No learning materials have been shared yet.</p>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>File</th>
                <th>Shared By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m._id}>
                  <td className="td-name">
                    {m.title}
                    {m.description && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#888', fontWeight: 400, whiteSpace: 'normal' }}>
                        {m.description}
                      </p>
                    )}
                  </td>
                  <td>{m.subject}</td>
                  <td>
                    <span className="file-chip">
                      <FileText size={13} /> {formatFileSize(m.fileSize)}
                    </span>
                  </td>
                  <td>{m.uploadedBy}</td>
                  <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="td-actions">
                    <a
                      className="action-btn view-btn"
                      title="View"
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye size={15} />
                    </a>
                    <a
                      className="action-btn view-btn"
                      title="Download"
                      href={m.fileUrl}
                      download={m.fileName || true}
                    >
                      <Download size={15} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentLearningMaterialsPage;