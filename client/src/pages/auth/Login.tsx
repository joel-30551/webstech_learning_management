import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert, Phone, Mail, GraduationCap } from 'lucide-react';
import "../../styles/auth/Login.css";
import { toast } from 'react-toastify';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('Network Error.Cannot connect to server.');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed. Please check your credentials.');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }


      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));


      const role = data.user?.role;
      if (role === 'admin') {
        toast.success("Welcome back Admin", {
          position: "top-center",
          autoClose: 6000,
          style: {
            color: "#419de9f9",
            background: "#f7f7f7f2",
          },
          
          progressClassName : "custom-progress",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/admin');
      } else if (role === 'teacher') {
        toast.success("Welcome back Teacher", {
          position: "top-center",
          autoClose: 6000,
          style: {
            color: "#419de9f9",
            background: "#f7f7f7f2",
          },
          progressClassName : "custom-progress",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/teacher');
      } else if (role === 'accountant') {
        toast.success("Welcome back Accountant", {
          position: "top-center",
          autoClose: 6000,
          style: {
            color: "#419de9f9",
            background: "#f7f7f7f2",
          },
          progressClassName : "custom-progress",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/accountant');
      } else if (role === 'student') {
        toast.success("Welcome back Student", {
          position: "top-center",
          autoClose: 6000,
          style: {
            color: "#419de9f9",
            background: "#f7f7f7f2",
          },
          progressClassName : "custom-progress",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/student');
      } else {
        navigate('/login');
      }

    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">


        <div className="login-left">
          <div className="mobile-brand-header">
            <GraduationCap size={32} className="mobile-logo-icon" />
            <div>
              <h3>Enosh College</h3>
              <span>School Management Portal System</span>
            </div>
          </div>

          <div className="form-header">
            <h2>Account Login</h2>
            <p>Enter your username and password to authenticate.</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? '...' : 'Login'}
            </button>
          </form>


          <div className="mobile-support-footer">
            <span>Support: admin@enoshcollege.edu</span>
          </div>
        </div>


        <div className="login-right">
          <div className="school-logo-wrapper">
            <div className="school-logo">
              <GraduationCap size={44} className="logo-svg" />
            </div>
            <h2>Enosh College</h2>
            <span className="system-tag">School Management Portal</span>
          </div>

          <div className="welcome-section">
            <p className="description">
              Provide your official credentials to securely access the Enosh College Management Portal, including student records, fee management, timetable schedules, learning materials, and school announcements.
            </p>
          </div>

          <div className="security-notice">
            <ShieldAlert size={16} className="notice-icon" />
            <span>Authorized access only. All sessions, data edits, and attempts are monitored.</span>
          </div>

          <div className="support-section">
            <h4>IT Assistance Desk</h4>
            <div className="support-links">
              <a href="mailto:admin@enoshcollege.edu" className="support-item">
                <Mail size={14} />
                <span>admin@enoshcollege.edu</span>
              </a>
              <a href="tel:+18005550199" className="support-item">
                <Phone size={14} />
                <span>+233 (202) 014-5045</span>
              </a>
            </div>
          </div>

          <footer className="login-footer">
            <p>© 2026 Enosh College. All rights reserved.</p>
          </footer>
        </div>

      </div>
    </div>
  );
};

export default Login;
