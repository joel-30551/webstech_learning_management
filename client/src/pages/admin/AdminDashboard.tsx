import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  UserCog,
  Calendar,
  BookOpen,
  Megaphone,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
} from 'lucide-react';
import './AdminDashboard.css';
import TeachersPage from './TeachersPage';
import StudentsPage from './StudentsPage';
import AccountantsPage from './AccountantsPage.tsx';
import UserAccountsPage from './UserAccountPage.tsx';
import TimetablePage from './TimetablePage.tsx';
import LearningMaterialsPage from './LearningMaterialsPage.tsx';
import AnnouncementPage from './AnnouncementsPage.tsx';
import SettingsPage from './SettingsPage.tsx';
import ProfilePage from './ProfilePage.tsx';

type TabType =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'accountants'
  | 'users'
  | 'timetables'
  | 'materials'
  | 'announcements'
  | 'settings'
  | 'profile';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalAccountants: number;
  totalAdmins: number;
  learningMaterials: number;
  timetables: number;
  announcements: number;
  onlineUsers: number;
  newStudentsThisTerm: number;
  newTeachersThisTerm: number;
  materialsThisWeek: number;
  pinnedAnnouncements: number;
}

interface RecentActivity {
  _id: string;
  type: 'student_signup' | 'material_upload' | 'announcement' | 'timetable_update' | 'user_created';
  actor: string;
  resource: string;
  timestamp: string;
  details?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalAccountants: 0,
    totalAdmins: 0,
    learningMaterials: 0,
    timetables: 0,
    announcements: 0,
    onlineUsers: 0,
    newStudentsThisTerm: 0,
    newTeachersThisTerm: 0,
    materialsThisWeek: 0,
    pinnedAnnouncements: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { username: 'Admin', role: 'admin' };

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/dashboard/recent-activities?limit=5', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecentActivities(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      }
    };

    fetchStats();
    fetchActivities();

    const statsInterval = setInterval(fetchStats, 30000);
    const activitiesInterval = setInterval(fetchActivities, 30000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(activitiesInterval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'teachers', label: 'Teachers', icon: <GraduationCap size={18} /> },
    { id: 'accountants', label: 'Accountants', icon: <Briefcase size={18} /> },
    { id: 'users', label: 'User Accounts', icon: <UserCog size={18} /> },
    { id: 'timetables', label: 'Timetables', icon: <Calendar size={18} /> },
    { id: 'materials', label: 'Learning Materials', icon: <BookOpen size={18} /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const getTopbarTitle = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item ? item.label : 'Management Console';
  };

  const formatActivityType = (type: string): string => {
    const typeMap: Record<string, string> = {
      student_signup: 'registered',
      material_upload: 'uploaded',
      announcement: 'posted',
      timetable_update: 'updated',
      user_created: 'created',
    };
    return typeMap[type] || type;
  };

  // Compact stat definition — kept to 4 essentials for the primary row.
  const statCards = [
    {
      key: 'students',
      label: 'Students',
      value: stats.totalStudents,
      delta: stats.newStudentsThisTerm,
      deltaLabel: 'this term',
      icon: <Users size={20} />,
      tone: 'ocean',
    },
    {
      key: 'teachers',
      label: 'Teachers',
      value: stats.totalTeachers,
      delta: stats.newTeachersThisTerm,
      deltaLabel: 'new staff',
      icon: <GraduationCap size={20} />,
      tone: 'gold',
    },
    {
      key: 'materials',
      label: 'Materials',
      value: stats.learningMaterials,
      delta: stats.materialsThisWeek,
      deltaLabel: 'this week',
      icon: <BookOpen size={20} />,
      tone: 'moss',
    },
    {
      key: 'announcements',
      label: 'Announcements',
      value: stats.announcements,
      delta: stats.pinnedAnnouncements,
      deltaLabel: 'pinned',
      icon: <Megaphone size={20} />,
      tone: 'clay',
    },
  ];

  return (
    <div className="dash-layout">
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <span className="sidebar-logo">Enosh College</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-links">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType);
                setSidebarOpen(false);
              }}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="topbar-title">{getTopbarTitle()}</span>
          <div className="topbar-right">
            <span className="topbar-user">{user.username}</span>
            <div className="topbar-avatar"><User size={16} /></div>
          </div>
        </header>

        <div className="dash-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-view">
              <div className="dash-greeting">
                <h2>Welcome back, {user.username}</h2>
                <p className="dash-sub">Here's what's happening at Enosh College today.</p>
              </div>

              <div className="stats-grid">
                {statCards.map((card) => (
                  <div key={card.key} className={`stat-card tone-${card.tone}`}>
                    <div className="stat-card-icon">{card.icon}</div>
                    <div className="stat-card-body">
                      <p className="stat-card-label">{card.label}</p>
                      <h3 className="stat-card-value">
                        {statsLoading ? '—' : card.value.toLocaleString()}
                      </h3>
                    </div>
                    <p className="stat-card-delta">
                      <ArrowUpRight size={13} />
                      {statsLoading ? '' : `${card.delta} ${card.deltaLabel}`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="dash-panels">
                <div className="panel activities-panel">
                  <div className="panel-header">
                    <h3>Recent Activity</h3>
                    <a href="#" className="panel-link">View all</a>
                  </div>

                  <div className="activities-list">
                    {recentActivities.length === 0 ? (
                      <p className="empty-state">Nothing new yet — check back later.</p>
                    ) : (
                      recentActivities.slice(0, 5).map((activity) => (
                        <div key={activity._id} className="activity-row">
                          <span className={`activity-dot dot-${activity.type}`} />
                          <div className="activity-copy">
                            <p className="activity-text">
                              <strong>{activity.actor}</strong> {formatActivityType(activity.type)}{' '}
                              <strong>{activity.resource}</strong>
                            </p>
                            <p className="activity-time">
                              {new Date(activity.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="panel status-panel">
                  <div className="panel-header">
                    <h3>System</h3>
                  </div>
                  <div className="status-rows">
                    <div className="status-row">
                      <span className="status-key">Admin users</span>
                      <span className="status-val">{statsLoading ? '—' : stats.totalAdmins}</span>
                    </div>
                    <div className="status-row">
                      <span className="status-key">Online now</span>
                      <span className="status-val">
                        <span className="status-pulse" />
                        {statsLoading ? '—' : stats.onlineUsers}
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="status-key">Finance staff</span>
                      <span className="status-val">{statsLoading ? '—' : stats.totalAccountants}</span>
                    </div>
                    <div className="status-row">
                      <span className="status-key">Timetables live</span>
                      <span className="status-val">{statsLoading ? '—' : stats.timetables}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && <StudentsPage />}
          {activeTab === 'teachers' && <TeachersPage />}
          {activeTab === 'accountants' && <AccountantsPage />}
          {activeTab === 'users' && <UserAccountsPage />}
          {activeTab === 'timetables' && <TimetablePage />}
          {activeTab === 'materials' && <LearningMaterialsPage />}
          {activeTab === 'announcements' && <AnnouncementPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'profile' && <ProfilePage />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;