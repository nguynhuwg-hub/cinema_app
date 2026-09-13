import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from './components/layout/MainLayout/MainLayout';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';

import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ProfilePage from './features/user/pages/ProfilePage';
import UserManagementPage from './features/user/pages/UserManagementPage';
import MovieListPage from './features/movie/pages/MovieListPage';
import MovieDetailPage from './features/movie/pages/MovieDetailPage';
import CinemaListPage from './features/cinema/pages/CinemaListPage';
import CinemaShowtimesPage from './features/cinema/pages/CinemaShowtimesPage';
import ShowtimeDetailPage from './features/showtime/pages/ShowtimeDetailPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import MovieManagementPage from './features/admin/pages/MovieManagementPage';
import CinemaManagementPage from './features/admin/pages/CinemaManagementPage';
import ShowtimeManagementPage from './features/admin/pages/ShowtimeManagementPage';
import NotificationsPage from './features/user/pages/NotificationsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Giao diện dành cho Khách & User (Dùng MainLayout) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<MovieListPage />} />
            <Route path="/movies/:id" element={<MovieDetailPage />} />
            <Route path="/showtimes/:id" element={<ShowtimeDetailPage />} />
            <Route path="/cinemas" element={<CinemaListPage />} />
            <Route path="/cinemas/:id/showtimes" element={<CinemaShowtimesPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Giao diện dành cho Admin (Dùng AdminLayout) */}
          <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/movies" element={<MovieManagementPage />} />
              <Route path="/admin/cinemas" element={<CinemaManagementPage />} />
              <Route path="/admin/showtimes" element={<ShowtimeManagementPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
          </Route>

          {/* Fallback route khi gõ sai đường dẫn */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;