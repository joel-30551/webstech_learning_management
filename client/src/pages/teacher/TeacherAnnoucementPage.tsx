import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Megaphone, Calendar, User } from 'lucide-react';
import '../../styles/teacher/TeacherAnnoucementPage.css';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  postedBy?: string;
  createdAt: string;
}

const SEEN_KEY = 'accountant_seen_announcements';

const getSeenIds = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markSeen = (id: string) => {
  try {
    const seen = new Set(getSeenIds());
    seen.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
};

const TeacherAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [seenIds, setSeenIds] = useState<string[]>(getSeenIds());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      // Read-only feed of announcements posted by admins for the
      // accountant role. Accountants cannot create, edit, or delete these.
      const res = await fetch('/api/announcements?audience=teacher', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const list: Announcement[] = Array.isArray(data) ? data : [];
      // Newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(list);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setFetchError('Could not load announcements. Check that /api/announcements exists and is reachable.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const filtered = useMemo(() => {
    if (!search.trim()) return announcements;
    const q = search.trim().toLowerCase();
    return announcements.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      (a.postedBy || '').toLowerCase().includes(q)
    );
  }, [announcements, search]);

  const unreadCount = announcements.filter(a => !seenIds.includes(a._id)).length;

  const toggleExpand = (a: Announcement) => {
    setExpandedId(prev => (prev === a._id ? null : a._id));
    if (!seenIds.includes(a._id)) {
      markSeen(a._id);
      setSeenIds(prev => [...prev, a._id]);
    }
  };

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>Announcements</h2>
          <p>Updates and notices posted by the administration.</p>
        </div>
        {unreadCount > 0 && (
          <span className="badge badge-red announcements-unread-badge">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="mgmt-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search announcements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <p className="record-count">{filtered.length} announcement{filtered.length !== 1 ? 's' : ''}</p>

      {/* List */}
      <div className="announcements-list">
        {loading ? (
          <p className="table-state">Loading announcements...</p>
        ) : fetchError ? (
          <p className="table-state">{fetchError}</p>
        ) : filtered.length === 0 ? (
          <p className="table-state">No announcements yet.</p>
        ) : (
          filtered.map(a => {
            const isUnseen = !seenIds.includes(a._id);
            const isExpanded = expandedId === a._id;
            return (
              <div
                key={a._id}
                className={`announcement-card ${isUnseen ? 'announcement-unread' : ''}`}
                onClick={() => toggleExpand(a)}
              >
                <div className="announcement-icon">
                  <Megaphone size={18} />
                </div>
                <div className="announcement-body">
                  <div className="announcement-top">
                    <h4>{a.title}</h4>
                    {isUnseen && <span className="badge badge-red">New</span>}
                  </div>
                  <p className={`announcement-message ${isExpanded ? 'expanded' : 'clamped'}`}>
                    {a.message}
                  </p>
                  <div className="announcement-meta">
                    <span><User size={12} /> {a.postedBy || 'Admin'}</span>
                    <span><Calendar size={12} /> {new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeacherAnnouncementsPage;