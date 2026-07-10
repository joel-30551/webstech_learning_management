import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, FileText, Download, Eye } from 'lucide-react';
import '../../styles/teacher/TeacherTimeTable.css';

interface Timetable {
    _id: string;
    title: string;
    term: 'First Term' | 'Second Term' | 'Third Term';
    stream: 'WASSCE' | 'NOVDEC';
    academicYear: string;
    fileUrl: string;      // Cloudinary secure_url
    fileName: string;
    fileSize?: number;    // bytes
    uploadedAt: string;
    uploadedBy?: string;
}

const termOptions: Timetable['term'][] = ['First Term', 'Second Term', 'Third Term'];
const streamOptions: Timetable['stream'][] = ['WASSCE', 'NOVDEC'];

const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TeacherTimetablePage: React.FC = () => {
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [search, setSearch] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [filterStream, setFilterStream] = useState('');

    const fetchTimetables = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filterTerm) params.append('term', filterTerm);
        if (filterStream) params.append('stream', filterStream);

        try {
            // Read-only: teachers can view and download timetables uploaded
            // by admins, but cannot upload, edit, or delete them.
            const res = await fetch(`/api/timetables?${params.toString()}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
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

    return (
        <div className="mgmt-page">
            {/* Header */}
            <div className="mgmt-header">
                <div>
                    <h2>Timetables</h2>
                    <p>View and download the timetables posted by administration.</p>
                </div>
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
                            {streamOptions.map(s => (<option key={s} value={s}>{s}</option>))}
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
                    <p className="table-state">No timetables have been posted yet.</p>
                ) : (
                    <table className="mgmt-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Term</th>
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

export default TeacherTimetablePage;