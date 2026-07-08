import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Wallet,
  Megaphone,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import '../admin/AdminDashboard.css';
import StudentTimetablePage from './StudentTimetablePage.tsx';
import StudentLearningMaterialsPage from './StudentLearnMat.tsx';
import StudentAccountPage from './StudentAccountPage.tsx';
import StudentAnnouncementsPage from './StudentAnnoucementPage.tsx';
import StudentProfilePage from './StudentProfilePage.tsx';

type TabType =
  | 'dashboard'
  | 'timetables'
  | 'materials'
  | 'accounts'
  | 'announcements'
  | 'profile';

interface StudentStats {
  timetablesCount: number;
  materialsCount: number;
  unpaidFeesCount: number;
  outstandingBalance: number;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [stats, setStats] = useState<StudentStats>({
    timetablesCount: 0,
    materialsCount: 0,
    unpaidFeesCount: 0,
    outstandingBalance: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { username: 'Student', role: 'student' };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [ttRes, matRes, feeRes] = await Promise.all([
        fetch('/api/timetables', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/learning-materials/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/fees/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const timetables = ttRes.ok ? await ttRes.json() : [];
      const materials = matRes.ok ? await matRes.json() : [];
      const fees = feeRes.ok ? await feeRes.json() : [];

      const feesList = Array.isArray(fees) ? fees : [];
      const outstanding = feesList.reduce((sum: number, f: any) => sum + (f.balance || 0), 0);
      const unpaidCount = feesList.filter((f: any) => f.status !== 'paid').length;

      setStats({
        timetablesCount: Array.isArray(timetables) ? timetables.length : 0,
        materialsCount: Array.isArray(materials) ? materials.length : 0,
        unpaidFeesCount: unpaidCount,
        outstandingBalance: outstanding,
      });
    } catch (err) {
      console.error('Failed to fetch student stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

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
    { id: 'accounts', label: 'My Billing', icon: <Wallet size={18} /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const getTopbarTitle = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item ? item.label : 'Student Portal';
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
              <h2>Welcome back, {user.firstName || user.username}</h2>
              <p className="dash-sub">Here's a quick look at your academic standing and details.</p>

              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-icon timetable-icon">
                    <Calendar size={24} />
                  </div>
                  <p className="stat-label">Timetables Posted</p>
                  <h3 className="stat-value">{statsLoading ? '—' : stats.timetablesCount.toLocaleString()}</h3>
                  <p className="stat-change neutral">Current term</p>
                </div>

                <div className="stat-box">
                  <div className="stat-icon materials-icon">
                    <BookOpen size={24} />
                  </div>
                  <p className="stat-label">My Learning Materials</p>
                  <h3 className="stat-value">{statsLoading ? '—' : stats.materialsCount.toLocaleString()}</h3>
                  <p className="stat-change positive">Shared by teachers</p>
                </div>

                <div className="stat-box">
                  <div className="stat-icon active-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={24} style={{ color: stats.outstandingBalance > 0 ? '#ef4444' : '#22c55e' }} />
                  </div>
                  <p className="stat-label">Outstanding Fees</p>
                  <h3 className="stat-value">
                    {statsLoading
                      ? '—'
                      : `GHS ${stats.outstandingBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </h3>
                  <p className="stat-change negative">
                    {stats.unpaidFeesCount > 0 ? `${stats.unpaidFeesCount} unpaid invoices` : 'Fully paid'}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'timetables' && <StudentTimetablePage />}
          {activeTab === 'materials' && <StudentLearningMaterialsPage />}
          {activeTab === 'accounts' && <StudentAccountPage />}
          {activeTab === 'announcements' && <StudentAnnouncementsPage />}
          {activeTab === 'profile' && <StudentProfilePage />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
