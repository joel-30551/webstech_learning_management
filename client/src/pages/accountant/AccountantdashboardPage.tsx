import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Megaphone,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import '../../styles/accountant/AccountantdashboardPage.css';
import AccountsPage from './AccountsPage.tsx';
import AccountantAnnouncementsPage from './AccountantAnnoucementsPage.tsx';
import AccountantProfilePage from './AccountantProfilePage.tsx';

type TabType =
  | 'dashboard'
  | 'accounts'
  | 'announcements'
  | 'profile';

const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [stats, setStats] = useState({ collected: 0, outstanding: 0, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { username: 'Accountant', role: 'accountant' };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setStatsLoading(true);
      fetch('/api/fees')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const collected = data.reduce((sum: number, f: any) => sum + (f.amountPaid || 0), 0);
            const outstanding = data.reduce((sum: number, f: any) => sum + (f.balance || 0), 0);
            setStats({ collected, outstanding, count: data.length });
          }
        })
        .catch(err => console.error('Failed to load financial stats:', err))
        .finally(() => setStatsLoading(false));
    }
  }, [activeTab]);

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
    { id: 'accounts', label: 'Fees & Accounts', icon: <Wallet size={18} /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
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
              <p className="dash-sub">Here's a quick overview of active financial transactions.</p>

              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-icon active-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={24} style={{ color: '#22c55e' }} />
                  </div>
                  <p className="stat-label">Total Fees Collected</p>
                  <h3 className="stat-value">{statsLoading ? '—' : `GHS ${stats.collected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</h3>
                  <p className="stat-change positive">From students</p>
                </div>

                <div className="stat-box">
                  <div className="stat-icon active-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={24} style={{ color: '#ef4444' }} />
                  </div>
                  <p className="stat-label">Total Outstanding Balance</p>
                  <h3 className="stat-value">{statsLoading ? '—' : `GHS ${stats.outstanding.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</h3>
                  <p className="stat-change negative">Awaiting payment</p>
                </div>

                <div className="stat-box">
                  <div className="stat-icon active-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LayoutDashboard size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <p className="stat-label">Transactions Count</p>
                  <h3 className="stat-value">{statsLoading ? '—' : stats.count.toLocaleString()}</h3>
                  <p className="stat-change neutral">Total records</p>
                </div>
              </div>
            </>
          )}
          {activeTab === 'accounts' && <AccountsPage />}
          {activeTab === 'announcements' && <AccountantAnnouncementsPage />}
          {activeTab === 'profile' && <AccountantProfilePage />}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;