import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboardPage';
import AccountantDashboard from './pages/accountant/AccountantdashboardPage';
import StudentDashboard from './pages/student/StudentDashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';

const RootRedirect = () => {
  const userRaw = localStorage.getItem('user');
  if (!userRaw) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(userRaw);
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (user.role === 'accountant') return <Navigate to="/accountant" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Portals */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accountant/*"
          element={
            <ProtectedRoute allowedRoles={['accountant']}>
              <AccountantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/dashboard" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
