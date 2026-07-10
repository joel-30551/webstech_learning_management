import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import '../../styles/admin/AdminDashboard.css';
import TeacherTimetablePage from './TeacherTimeTablePage.tsx';
import TeacherLearningMaterialsPage from './TeacherLearnMatPage.tsx';
import TeacherProfilePage from './TeacherProfilePage.tsx';


type TabType =
  | 'dashboard'
  | 'timetables'
  | 'materials'
  | 'profile';

interface TeacherStats {
  timetablesAvailable: number;
  myMaterials: number;
  totalMaterials: number;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [stats, setStats] = useState<TeacherStats>({
    timetablesAvailable: 0,
    myMaterials: 0,
    totalMaterials: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { username: 'Teacher', role: 'teacher' };
  const currentUserName: string = user?.fullName || user?.username || '';

  // Real stats derived from the same endpoints the Timetables and Learning
  // Materials pages use — no mock numbers.
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [ttRes, matRes] = await Promise.all([
        fetch('/api/timetables', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/learning-materials', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const timetables = ttRes.ok ? await ttRes.json() : [];
      const materials = matRes.ok ? await matRes.json() : [];
      const materialsList = Array.isArray(materials) ? materials : [];

      setStats({
        timetablesAvailable: Array.isArray(timetables) ? timetables.length : 0,
        totalMaterials: materialsList.length,
        myMaterials: materialsList.filter(
          (m: any) => currentUserName && m.uploadedBy?.toLowerCase() === currentUserName.toLowerCase()
        ).length,
      });
    } catch (err) {
      console.error('Failed to fetch teacher stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [currentUserName]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
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
    { id: 'timetables', label: 'Timetables', icon: <Calendar size={18} /> },
    { id: 'materials', label: 'Learning Materials', icon: <BookOpen size={18} /> },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const getTopbarTitle = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item ? item.label : 'Management Console';
  };

  return (
    <div className="dash-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <span className="sidebar-logo">Enosh College</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
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

      {/* Main Container */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="topbar-title">{getTopbarTitle()}</span>
          <div className="topbar-right">
            <button className="topbar-bell"><User size={20} /></button>
            <span className="topbar-user">{user.username}</span>
          </div>
        </header>

        {/* Multi-Tab Dynamic Content */}
        <div className="dash-content">
          {activeTab === 'dashboard' && (
            <>
              <h2>Welcome back, {user.username}</h2>
              <p className="dash-sub">Here's a quick overview of your teaching resources.</p>

              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-icon timetable-icon">
                    <Calendar size={24} />
                  </div>
                  <p className="stat-label">Timetables Available</p>
                  <h3 className="stat-value">{statsLoading ? '—' : stats.timetablesAvailable.toLocaleString()}</h3>
                  <p className="stat-change neutral">Current term</p>
                </div>

                <div className="stat-box">
                  <div className="stat-icon materials-icon">
                    <BookOpen size={24} />
                  </div>
                  <p className="stat-label">My Learning Materials</p>
                  <h3 className="stat-value">{statsLoading ? '—' : stats.myMaterials.toLocaleString()}</h3>
                  <p className="stat-change neutral">Uploaded by you</p>
                </div>

                <div className="stat-box">
                  <div className="stat-icon active-icon">
                    <LayoutDashboard size={24} />
                  </div>
                  <p className="stat-label">Total Materials</p>
                  <h3 className="stat-value">{statsLoading ? '—' : stats.totalMaterials.toLocaleString()}</h3>
                  <p className="stat-change neutral">Across all teachers</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'timetables' && <TeacherTimetablePage />}
          {activeTab === 'materials' && <TeacherLearningMaterialsPage />}
          {activeTab === 'profile' && <TeacherProfilePage />}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;