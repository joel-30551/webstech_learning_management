import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,Pencil, Trash2, X, ChevronDown, FileText,
    Upload, Download, Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../../styles/admin/TimeTablePage.css';

interface Timetable {
    _id: string;
    title: string;
    term: 'First Term' | 'Second Term' | 'Third Term';
    week: string;
    stream: string;
    academicYear: string;
    fileUrl: string;      // Cloudinary secure_url
    fileName: string;
    fileSize?: number;    // bytes
    uploadedAt: string;
    uploadedBy?: string;
}

interface TimetableForm {
    title: string;
    term: Timetable['term'];
    week: string;
    stream: string;
    academicYear: string;
    file: File | null;
}

const currentAcademicYear = (() => {
    const y = new Date().getFullYear();
    return `${y}/${y + 1}`;
})();

const emptyForm: TimetableForm = {
    title: '',
    term: 'First Term',
    week: '',
    stream: 'All Streams',
    academicYear: currentAcademicYear,
    file: null,
};

const termOptions: Timetable['term'][] = ['First Term', 'Second Term', 'Third Term'];

// Hardcoded list of streams — adjust to match your school's actual programs
const availableStreams = [
    'All Streams', 'Science', 'Business', 'General Arts', 'Visual Arts', 'Home Economics',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TimetablePage: React.FC = () => {
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [search, setSearch] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [filterStream, setFilterStream] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Timetable | null>(null);

    const [form, setForm] = useState<TimetableForm>(emptyForm);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [deleteTarget, setDeleteTarget] = useState<Timetable | null>(null);

    const fetchTimetables = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filterTerm) params.append('term', filterTerm);
        if (filterStream) params.append('stream', filterStream);

        try {
            const res = await fetch(`/api/timetables?${params.toString()}`);
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            setTimetables(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load timetables:', err);
            setFetchError('Could not load timetables. Check that /api/timetables exists and is reachable.');
            setTimetables([]);
        } finally {
            setLoading(false);
        }
    }, [search, filterTerm, filterStream]);

    useEffect(() => { fetchTimetables(); }, [fetchTimetables]);

    const openAdd = () => {
        setEditing(null);
        setFormError('');
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (t: Timetable) => {
        setEditing(t);
        setForm({
            title: t.title,
            term: t.term,
            week: t.week,
            stream: t.stream,
            academicYear: t.academicYear,
            file: null, // leave blank unless replacing the PDF
        });
        setFormError('');
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormError('');

        if (file) {
            if (file.type !== 'application/pdf') {
                setFormError('Only PDF files are allowed.');
                e.target.value = '';
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                setFormError('File exceeds the 15MB limit.');
                e.target.value = '';
                return;
            }
        }
        setForm(f => ({ ...f, file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!editing && !form.file) {
            setFormError('Please select a PDF file to upload.');
            return;
        }

        setFormLoading(true);
        setUploadProgress(0);

        const body = new FormData();
        body.append('title', form.title);
        body.append('term', form.term);
        body.append('week', form.week);
        body.append('stream', form.stream);
        body.append('academicYear', form.academicYear);
        if (form.file) body.append('file', form.file);

        const url = editing ? `/api/timetables/${editing._id}` : '/api/timetables';
        const method = editing ? 'PUT' : 'POST';

        try {
            // Using XHR instead of fetch so we can show upload progress for
            // potentially large PDF uploads to Cloudinary via the backend.
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(method, url);
                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            reject(new Error(data.message || 'Upload failed.'));
                            toast.success("Timetable Uploaded successfully!")
                        } catch {
                            reject(new Error('Upload failed.'));
                        }
                    }
                };
                xhr.onerror = () => reject(new Error('Network error. Please try again.'));
                xhr.send(body);
            });

            setShowModal(false);
            fetchTimetables();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Operation failed.');
        } finally {
            setFormLoading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await fetch(`/api/timetables/${deleteTarget._id}`, { method: 'DELETE' });
        setDeleteTarget(null);
        fetchTimetables();
    };

    return (
        <div className="mgmt-page">
            {/* Header */}
            <div className="mgmt-header">
                <div>
                    <h2>Timetable Management</h2>
                    <p>Upload, organize, and share term timetables by week and stream.</p>
                </div>
                <button id='btn' className="btn-add" onClick={openAdd}>
                    <Upload size={16} /> Upload Timetable
                </button>
            </div>

            {/* Toolbar */}
            <div className="mgmt-toolbar">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        placeholder="Search by title, term, stream..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <div className="filter-select">
                        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
                            <option value="">All Terms</option>
                            {termOptions.map(t => (<option key={t} value={t}>{t}</option>))}
                        </select>
                        <ChevronDown size={14} />
                    </div>
                    <div className="filter-select">
                        <select value={filterStream} onChange={e => setFilterStream(e.target.value)}>
                            <option value="">All Streams</option>
                            {availableStreams.map(s => (<option key={s} value={s}>{s}</option>))}
                        </select>
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>

            {/* Count */}
            <p className="record-count">{timetables.length} timetable{timetables.length !== 1 ? 's' : ''} found</p>

            {/* Table */}
            <div className="table-wrapper">
                {loading ? (
                    <p className="table-state">Loading timetables...</p>
                ) : fetchError ? (
                    <p className="table-state table-state-error">{fetchError}</p>
                ) : timetables.length === 0 ? (
                    <p className="table-state">No timetables uploaded yet. Upload one to get started.</p>
                ) : (
                    <table className="mgmt-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Term</th>
                                <th>Week</th>
                                <th>Stream</th>
                                <th>Academic Year</th>
                                <th>File</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timetables.map(t => (
                                <tr key={t._id}>
                                    <td className="td-name">{t.title}</td>
                                    <td>{t.term}</td>
                                    <td>{t.week || '—'}</td>
                                    <td><span className="badge-exam">{t.stream}</span></td>
                                    <td>{t.academicYear}</td>
                                    <td>
                                        <span className="file-chip">
                                            <FileText size={13} /> {formatFileSize(t.fileSize)}
                                        </span>
                                    </td>
                                    <td>{t.uploadedAt ? new Date(t.uploadedAt).toLocaleDateString() : '—'}</td>
                                    <td className="td-actions">
                                        <a
                                            className="action-btn view-btn"
                                            title="View PDF"
                                            href={t.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Eye size={15} />
                                        </a>
                                        <a
                                            className="action-btn view-btn"
                                            title="Download PDF"
                                            href={t.fileUrl}
                                            download={t.fileName || true}
                                        >
                                            <Download size={15} />
                                        </a>
                                        <button className="action-btn edit-btn" title="Edit details" onClick={() => openEdit(t)}>
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
                            <h3>{editing ? 'Edit Timetable Details' : 'Upload New Timetable'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        {formError && <p className="modal-error">{formError}</p>}
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Science— First Term Timetable"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Term *</label>
                                    <select required value={form.term} onChange={e => setForm({ ...form, term: e.target.value as Timetable['term'] })}>
                                        {termOptions.map(t => (<option key={t} value={t}>{t}</option>))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Week *</label>
                                    <input
                                        required
                                        value={form.week}
                                        onChange={e => setForm({ ...form, week: e.target.value })}
                                        placeholder="Week 1 or Full Term"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Stream *</label>
                                    <select required value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}>
                                        {availableStreams.map(s => (<option key={s} value={s}>{s}</option>))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Academic Year *</label>
                                    <input
                                        required
                                        value={form.academicYear}
                                        onChange={e => setForm({ ...form, academicYear: e.target.value })}
                                        placeholder="2025/2026"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{editing ? 'Replace PDF File (optional)' : 'PDF File *'}</label>
                                <div className="file-drop">
                                    <Upload size={16} />
                                    <input type="file" accept="application/pdf" onChange={handleFileChange} />
                                    {form.file && <span className="file-drop-name">{form.file.name}</span>}
                                    {editing && !form.file && (
                                        <span className="file-drop-name file-drop-existing">Current: {editing.fileName}</span>
                                    )}
                                </div>
                                <p className="field-hint">PDF only, max 15MB.</p>
                            </div>

                            {formLoading && uploadProgress > 0 && (
                                <div className="upload-progress">
                                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                                    <span>{uploadProgress}%</span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button id="btn-cancel" type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button id="btn" type="submit" className="btn-submit" disabled={formLoading}>
                                    {formLoading ? 'Uploading...' : editing ? 'Save Changes' : 'Upload Timetable'}
                                </button>
                            </div>
                        </form>
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
                            Are you sure you want to delete <strong>{deleteTarget.title}</strong>
                            {' '}({deleteTarget.term}, {deleteTarget.stream})? This cannot be undone.
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

export default TimetablePage;