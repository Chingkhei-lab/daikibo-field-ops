import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { RegisterScreen } from '@/components/Auth/RegisterScreen';
import { Dashboard } from '@/pages/Dashboard';
import { ActivityLogger } from '@/components/ActivityLogger';
import { NavigationView } from '@/components/Navigation/NavigationView';
import { NewFarmPage } from '@/pages/FarmOnboarding';
import { FarmList } from '@/pages/FarmList';
import { ActivityHistory } from '@/pages/ActivityHistory';
import { useAuthStore } from '@/stores/authStore';
import db from '@/db/FieldOpsDB';
import { AdminLayout } from '@/components/Admin/Layout/AdminLayout';
import { AdminDashboard } from '@/pages/Admin/Dashboard';
import { LiveMap } from '@/components/Admin/Tracking/LiveMap';
import { OfficersPage } from '@/pages/Admin/Officers';
import { FarmAssignmentPage } from '@/pages/Admin/FarmAssignment';
import { FarmDatabasePage } from '@/pages/Admin/FarmDatabase';
import { PlaceholderPage } from "@/pages/Admin/Placeholder";
import { ProfilePage } from "@/pages/Admin/Profile";
import { ActivityLog } from "@/components/Admin/Activities/ActivityLog";
import { AnalyticsDashboard } from "@/components/Admin/Analytics/AnalyticsDashboard";

function App() {
  const { user, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        login({ ...parsedUser, token });
      } catch (e) {
        console.error('Failed to parse user data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, [login]);

  const handleLogout = async () => {
    try {
      // Clear local data
      await db.clearAllData();
    } catch (error) {
      console.error('Error clearing local DB:', error);
      // Continue to logout even if DB clear fails
    }

    // Clear session
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} replace />
            ) : (
              <Signup />
            )
          }
        />
        <Route
          path="/register-officer"
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} replace />
            ) : (
              <RegisterScreen />
            )
          }
        />

        {/* Field Officer Routes */}
        <Route
          path="/dashboard"
          element={
            user && user.role === 'field_officer' ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/navigation"
          element={
            user && user.role === 'field_officer' ? (
              <NavigationView />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/activity/new"
          element={
            user && user.role === 'field_officer' ? (
              <ActivityLogger userId={user.id} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/farm/new"
          element={
            user && user.role === 'field_officer' ? (
              <NewFarmPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/farms"
          element={
            user && user.role === 'field_officer' ? (
              <FarmList />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/activities"
          element={
            user && user.role === 'field_officer' ? (
              <ActivityHistory />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <AdminLayout onLogout={handleLogout} />
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="officers" element={<OfficersPage />} />
          <Route path="farms" element={<FarmDatabasePage />} />
          <Route path="assignments" element={<FarmAssignmentPage />} />
          <Route path="tracking" element={<LiveMap />} />
          <Route path="activities" element={<ActivityLog />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route
          path="/"
          element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />}
        />
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
