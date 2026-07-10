import React, { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, Hash, Lock, Eye, EyeOff,
  Edit2, Check, X, AlertCircle, Calendar,
} from 'lucide-react';
import '../../styles/accountant/AccountantProfilePage.css';

interface AccountantProfile {
  _id: string;
  userId: string;
  accountantId: string;
  fullName: string;
  phone: string;
  residence: string;
  createdAt?: string;
}

interface EditForm {
  fullName: string;
  phone: string;
  residence: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AccountantProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AccountantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    fullName: '',
    phone: '',
    residence: '',
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch the logged-in accountant's own record from the Accountants
  // collection (the record itself is created/managed by an admin — this
  // page only reads it and lets the accountant update their own contact
  // details and password).
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/accountants/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setProfile(data);
        setEditForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          residence: data.residence || '',
        });
      } catch (err) {
        console.error('Failed to load accountant profile:', err);
        setError('Could not load your profile. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess(false);
    setEditLoading(true);

    if (!editForm.fullName) {
      setEditError('Full name is required.');
      setEditLoading(false);
      return;
    }

    try {
      // Updates the accountant's own record by their accountant _id.
      const res = await fetch(`/api/accountants/${profile?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.message || 'Failed to update profile.');
        return;
      }

      setProfile(data);
      setEditSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      // Password lives on the linked User Account (userId), not on the
      // Accountant record itself, so this goes through the shared
      // change-password endpoint.
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || 'Failed to change password.');
        return;
      }

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mgmt-page">
        <p style={{ textAlign: 'center', marginTop: 40 }}>Loading your profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mgmt-page">
        <div className="alert alert-error">
          <AlertCircle size={18} />
          {error || 'Failed to load profile.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>My Profile</h2>
          <p>Manage your contact information and account security.</p>
        </div>
      </div>

      {/* Success Alerts */}
      {editSuccess && (
        <div className="alert alert-success">
          <Check size={18} />
          Profile updated successfully.
        </div>
      )}
      {passwordSuccess && (
        <div className="alert alert-success">
          <Check size={18} />
          Password changed successfully.
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="profile-overview">
        <div className="profile-avatar">
          <User size={48} />
        </div>
        <div className="profile-info">
          <h3>{profile.fullName}</h3>
          <p className="role-badge">Accountant</p>
          <p className="username">{profile.accountantId}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="profile-grid-columns">
        {/* Left Column: Profile Information */}
        <div className="profile-section">
          <div className="section-header">
            <h4><User size={18} /> Profile Information</h4>
            {!isEditingProfile && (
              <button className="btn-secondary" onClick={() => setIsEditingProfile(true)}>
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form className="profile-form" onSubmit={handleEditProfile}>
              {editError && <p className="form-error">{editError}</p>}

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+233 (or your country code)"
                />
              </div>

              <div className="form-group">
                <label>Residence</label>
                <input
                  value={editForm.residence}
                  onChange={e => setEditForm({ ...editForm, residence: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditingProfile(false)}>
                  <X size={14} /> Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  <Check size={14} /> {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <div className="profile-row">
                <span className="profile-label"><User size={14} /> Full Name</span>
                <span className="profile-value">{profile.fullName}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label"><Phone size={14} /> Phone</span>
                <span className="profile-value">{profile.phone || '—'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label"><MapPin size={14} /> Residence</span>
                <span className="profile-value">{profile.residence || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Account & Security */}
        <div className="profile-section">
          <div className="section-header">
            <h4><Hash size={18} /> Account & Security</h4>
          </div>

          <div className="profile-display">
            <div className="profile-row">
              <span className="profile-label"><Hash size={14} /> Accountant ID</span>
              <span className="profile-value">{profile.accountantId}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><Calendar size={14} /> Member Since</span>
              <span className="profile-value">
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {!isChangingPassword ? (
            <button className="btn-secondary full-width" onClick={() => setIsChangingPassword(true)}>
              <Lock size={14} /> Change Password
            </button>
          ) : (
            <form className="profile-form" onSubmit={handleChangePassword}>
              {passwordError && <p className="form-error">{passwordError}</p>}

              <div className="form-group">
                <label>Current Password *</label>
                <div className="password-input">
                  <input
                    required
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <div className="password-input">
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <div className="password-input">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsChangingPassword(false)}>
                  <X size={14} /> Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={passwordLoading}>
                  <Check size={14} /> {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountantProfilePage;