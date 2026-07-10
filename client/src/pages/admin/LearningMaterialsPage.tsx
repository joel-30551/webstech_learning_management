import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Pencil, Trash2, X, ChevronDown, FileText,
    Upload, Download, Eye, BookOpen,
} from 'lucide-react';
import '../../styles/admin/LearningMaterialsPage.css';

interface LearningMaterial {
    _id: string;
    title: string;
    subject: string;
    classLevel: string; // 'SHS 1', 'SHS 2', 'SHS 3'
    description?: string;
    fileUrl: string;      // Cloudinary secure_url
    fileName: string;
    fileSize?: number;    // bytes
    uploadedAt: string;
    uploadedBy?: string;
    accessCount?: number; // number of views/downloads
}

interface LearningMaterialForm {
    title: string;
    subject: string;
    classLevel: string;
    description: string;
    file: File | null;
}

const emptyForm: LearningMaterialForm = {
    title: '',
    subject: '',
    classLevel: 'SHS 1',
    description: '',
    file: null,
};

// Hardcoded list of class levels
const availableClasses = ['SHS 1', 'SHS 2', 'SHS 3'];

// Common subjects — can be extended as needed
const commonSubjects = [
    'English',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Economics',
    'Accounting',
    'Business Studies',
    'Integrated Science',
    'Information Technology',
    'Visual Arts',
    'Physical Education',
    'French',
    'Arabic',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LearningMaterialsPage: React.FC = () => {
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [search, setSearch] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterClass, setFilterClass] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<LearningMaterial | null>(null);

    const [form, setForm] = useState<LearningMaterialForm>(emptyForm);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [deleteTarget, setDeleteTarget] = useState<LearningMaterial | null>(null);

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filterSubject) params.append('subject', filterSubject);
        if (filterClass) params.append('classLevel', filterClass);

        try {
            const res = await fetch(`/api/learning-materials?${params.toString()}`);
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            setMaterials(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load learning materials:', err);
            setFetchError('Could not load materials. Check that /api/learning-materials exists and is reachable.');
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    }, [search, filterSubject, filterClass]);

    useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

    const openAdd = () => {
        setEditing(null);
        setFormError('');
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (m: LearningMaterial) => {
        setEditing(m);
        setForm({
            title: m.title,
            subject: m.subject,
            classLevel: m.classLevel,
            description: m.description || '',
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
                setFormError('File exceeds the 20MB limit.');
                e.target.value = '';
                return;
            }
        }
        setForm(f => ({ ...f, file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!form.title || !form.subject || !form.classLevel) {
            setFormError('Please fill in all required fields.');
            return;
        }

        if (!editing && !form.file) {
            setFormError('Please select a PDF file to upload.');
            return;
        }

        setFormLoading(true);
        setUploadProgress(0);

        const body = new FormData();
        body.append('title', form.title);
        body.append('subject', form.subject);
        body.append('classLevel', form.classLevel);
        body.append('description', form.description);
        if (form.file) body.append('file', form.file);

        const url = editing ? `/api/learning-materials/${editing._id}` : '/api/learning-materials';
        const method = editing ? 'PUT' : 'POST';

        try {
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
                        } catch {
                            reject(new Error('Upload failed.'));
                        }
                    }
                };
                xhr.onerror = () => reject(new Error('Network error. Please try again.'));
                xhr.send(body);
            });

            setShowModal(false);
            fetchMaterials();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Operation failed.');
        } finally {
            setFormLoading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await fetch(`/api/learning-materials/${deleteTarget._id}`, { method: 'DELETE' });
        setDeleteTarget(null);
        fetchMaterials();
    };

    return (
        <div className="mgmt-page">
            {/* Header */}
            <div className="mgmt-header">
                <div>
                    <h2>Learning Materials</h2>
                    <p>Upload, distribute, and manage PDF course resources for students.</p>
                </div>
                <button id="btn" className="btn-add" onClick={openAdd}>
                    <Upload size={16} /> Upload Material
                </button>
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
                            {commonSubjects.map(s => (<option key={s} value={s}>{s}</option>))}
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

            {/* Count */}
            <p className="record-count">{materials.length} material{materials.length !== 1 ? 's' : ''} found</p>

            {/* Table */}
            <div className="table-wrapper">
                {loading ? (
                    <p className="table-state">Loading learning materials...</p>
                ) : fetchError ? (
                    <p className="table-state table-state-error">{fetchError}</p>
                ) : materials.length === 0 ? (
                    <p className="table-state">No learning materials uploaded yet. Upload one to get started.</p>
                ) : (
                    <table className="mgmt-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Class</th>
                                <th>File</th>
                                <th>Views</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(m => (
                                <tr key={m._id}>
                                    <td className="td-name">
                                        <BookOpen size={13} className="title-icon" /> {m.title}
                                    </td>
                                    <td>{m.subject}</td>
                                    <td><span className="badge-exam">{m.classLevel}</span></td>
                                    <td>
                                        <span className="file-chip">
                                            <FileText size={13} /> {formatFileSize(m.fileSize)}
                                        </span>
                                    </td>
                                    <td>{m.accessCount ?? 0}</td>
                                    <td>{m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString() : '—'}</td>
                                    <td className="td-actions">
                                        <a
                                            className="action-btn view-btn"
                                            title="View PDF"
                                            href={m.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Eye size={15} />
                                        </a>
                                        <a
                                            className="action-btn view-btn"
                                            title="Download PDF"
                                            href={m.fileUrl}
                                            download={m.fileName || true}
                                        >
                                            <Download size={15} />
                                        </a>
                                        <button className="action-btn edit-btn" title="Edit details" onClick={() => openEdit(m)}>
                                            <Pencil size={15} />
                                        </button>
                                        <button className="action-btn delete-btn" title="Delete" onClick={() => setDeleteTarget(m)}>
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
                            <h3>{editing ? 'Edit Learning Material' : 'Upload Learning Material'}</h3>
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
                                    placeholder="e.g. Chapter 5: Photosynthesis"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Subject *</label>
                                    <input
                                        required
                                        list="subject-list"
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        placeholder="e.g. Biology"
                                    />
                                    <datalist id="subject-list">
                                        {commonSubjects.map(s => (<option key={s} value={s} />))}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label>Class Level *</label>
                                    <select required value={form.classLevel} onChange={e => setForm({ ...form, classLevel: e.target.value })}>
                                        {availableClasses.map(c => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description (optional)</label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description of the material content..."
                                />
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
                                <p className="field-hint">PDF only, max 20MB.</p>
                            </div>

                            {formLoading && uploadProgress > 0 && (
                                <div className="upload-progress">
                                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                                    <span>{uploadProgress}%</span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={formLoading}>
                                    {formLoading ? 'Uploading...' : editing ? 'Save Changes' : 'Upload Material'}
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
                            {' '}({deleteTarget.subject} — {deleteTarget.classLevel})? This cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button id="btn-cancel" className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button id="btn" className="btn-delete-confirm" onClick={handleDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningMaterialsPage;