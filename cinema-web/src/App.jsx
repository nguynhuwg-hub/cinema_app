import React, { useState, useEffect } from 'react';
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
import ProtectedRoute from './routes/ProtectedRoute';
import ReviewsPage from './features/reviews/pages/ReviewsPage';
import ReviewDetailPage from './features/reviews/pages/ReviewDetailPage';
import ReviewManagementPage from './features/admin/pages/ReviewManagementPage';
import ServicesPage from './features/services/pages/ServicesPage';

// --- IMPORT CÁC TRANG MỚI CỦA BẠN ---
import ConcessionManagement from './features/concession/pages/ConcessionManagement';
import CouponManagement from './features/concession/pages/CouponManagement';
import CustomerOrderPage from './features/concession/pages/CustomerOrderPage';

import './experience.css';

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
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/reviews/movie/:movieId" element={<ReviewsPage />} />
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />

            {/* Thêm đường dẫn trang đặt hàng F&B cho khách */}
            <Route path="/order-food" element={<CustomerOrderPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Giao diện dành cho Admin (Dùng AdminLayout) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/movies" element={<MovieManagementPage />} />
              <Route path="/admin/reviews" element={<ReviewManagementPage />} />
              <Route path="/admin/cinemas" element={<CinemaManagementPage />} />
              <Route path="/admin/showtimes" element={<ShowtimeManagementPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              
              {/* Thêm đường dẫn quản trị F&B và Coupon */}
              <Route path="/admin/concessions" element={<ConcessionManagement />} />
              <Route path="/admin/coupons" element={<CouponManagement />} />
            </Route>
          </Route>

          {/* Fallback route khi gõ sai đường dẫn */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;