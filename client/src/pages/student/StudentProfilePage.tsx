import React, { useState } from 'react';
import {
  User, Phone, Hash, Lock, Eye, EyeOff,
  Check, X, Calendar, Mail, GraduationCap
} from 'lucide-react';
import './StudentProfilePage.css';

interface StudentProfile {
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  classLevel: string;
  program: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  createdAt?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const StudentProfilePage: React.FC = () => {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { username: 'Student', role: 'student' };

  // Attempt to build a default local profile based on the user record in localStorage
  const [profile] = useState<StudentProfile>({
    _id: user.id || 'unknown',
    studentId: user.username?.toUpperCase() || 'STU1001',
    fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Enosh Student',
    email: `${user.username || 'student'}@enoshcollege.edu`,
    phone: '+233 20 201 4504',
    classLevel: 'SHS 3',
    program: 'General Science',
    gender: 'Male',
    guardianName: 'Akwasi Bruce',
    guardianPhone: '+233 24 555 9091',
    createdAt: new Date().toISOString(),
  });

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

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>My Profile</h2>
          <p>View your student details and manage account security.</p>
        </div>
      </div>

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
          <p className="role-badge">Student</p>
          <p className="username">{profile.studentId}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="profile-grid-columns">
        {/* Left Column: Student Details */}
        <div className="profile-section">
          <div className="section-header">
            <h4><GraduationCap size={18} /> Academic Details</h4>
          </div>

          <div className="profile-display">
            <div className="profile-row">
              <span className="profile-label"><Hash size={14} /> Student ID</span>
              <span className="profile-value">{profile.studentId}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><GraduationCap size={14} /> Class / Level</span>
              <span className="profile-value">{profile.classLevel}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><User size={14} /> Program of Study</span>
              <span className="profile-value">{profile.program}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><User size={14} /> Gender</span>
              <span className="profile-value">{profile.gender}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><Mail size={14} /> Email Address</span>
              <span className="profile-value">{profile.email}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><Phone size={14} /> Contact Number</span>
              <span className="profile-value">{profile.phone}</span>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 24 }}>
            <h4><User size={18} /> Guardian Information</h4>
          </div>
          <div className="profile-display">
            <div className="profile-row">
              <span className="profile-label"><User size={14} /> Guardian Name</span>
              <span className="profile-value">{profile.guardianName}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label"><Phone size={14} /> Guardian Phone</span>
              <span className="profile-value">{profile.guardianPhone}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Account & Security */}
        <div className="profile-section">
          <div className="section-header">
            <h4><Lock size={18} /> Account & Security</h4>
          </div>

          <div className="profile-display">
            <div className="profile-row">
              <span className="profile-label"><Calendar size={14} /> Registered Date</span>
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

export default StudentProfilePage;
