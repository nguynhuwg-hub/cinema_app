
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import MainLayout from './components/layout/MainLayout/MainLayout';
import ManagerLayout from './components/layout/ManagerLayout/ManagerLayout';
import AdminSystemLayout from './components/layout/AdminSystemLayout/AdminSystemLayout';
import ProfileLayout from './components/layout/ProfileLayout/ProfileLayout';

// Authentication
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// User
import ProfilePage from './features/user/pages/ProfilePage';
import UserManagementPage from './features/user/pages/UserManagementPage';
import NotificationsPage from './features/user/pages/NotificationsPage';

// Movies
import MovieListPage from './features/movie/pages/MovieListPage';
import MovieDetailPage from './features/movie/pages/MovieDetailPage';

// Cinemas
import CinemaListPage from './features/cinema/pages/CinemaListPage';
import CinemaShowtimesPage from './features/cinema/pages/CinemaShowtimesPage';

// Showtimes
import ShowtimeDetailPage from './features/showtime/pages/ShowtimeDetailPage';

// Booking, VNPay & Tickets
import CheckoutPage from './features/booking/pages/CheckoutPage';
import MyBookingsPage from './features/booking/pages/MyBookingsPage';
import TicketPage from './features/booking/pages/TicketPage';

// Management
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import MovieManagementPage from './features/admin/pages/MovieManagementPage';
import CinemaManagementPage from './features/admin/pages/CinemaManagementPage';
import ShowtimeManagementPage from './features/admin/pages/ShowtimeManagementPage';
import RolePermissionManagementPage from './features/admin/pages/RolePermissionManagementPage';

// Reviews
import ReviewsPage from './features/reviews/pages/ReviewsPage';
import ReviewDetailPage from './features/reviews/pages/ReviewDetailPage';
import ReviewManagementPage from './features/admin/pages/ReviewManagementPage';

// Services
import ServicesPage from './features/services/pages/ServicesPage';

import './experience.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* PUBLIC WEBSITE */}
          <Route element={<MainLayout />}>

            <Route
              path="/"
              element={<MovieListPage />}
            />

            <Route
              path="/movies/:id"
              element={<MovieDetailPage />}
            />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/showtimes/:id"
                element={<ShowtimeDetailPage />}
              />

              <Route
                path="/cinemas"
                element={<CinemaListPage />}
              />

              <Route
                path="/cinemas/:id/showtimes"
                element={<CinemaShowtimesPage />}
              />
            </Route>

            {/* Reviews */}
            <Route
              path="/reviews"
              element={<ReviewsPage />}
            />

            <Route
              path="/reviews/movie/:movieId"
              element={<ReviewsPage />}
            />

            <Route
              path="/reviews/:id"
              element={<ReviewDetailPage />}
            />

            {/* Services */}
            <Route
              path="/services"
              element={<ServicesPage />}
            />

            {/* Authentication */}
            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register"
              element={<RegisterPage />}
            />

            {/* Notifications */}
            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />

            {/* Booking & VNPay */}
            <Route element={<ProtectedRoute />}>

              <Route
                path="/checkout/:id"
                element={<CheckoutPage />}
              />

              <Route
                path="/tickets/:id"
                element={<TicketPage />}
              />

              <Route
                path="/bookings"
                element={<MyBookingsPage />}
              />

            </Route>

          </Route>

          {/* USER PROFILE */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ProfileLayout />}>

              <Route
                path="/profile"
                element={<ProfilePage />}
              />

            </Route>
          </Route>

          {/* MANAGER */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['MANAGER']}
              />
            }
          >
            <Route element={<ManagerLayout />}>

              <Route
                path="/manager"
                element={
                  <Navigate
                    to="/manager/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/manager/dashboard"
                element={<AdminDashboardPage />}
              />

              <Route
                path="/manager/movies"
                element={<MovieManagementPage />}
              />

              <Route
                path="/manager/reviews"
                element={<ReviewManagementPage />}
              />

              <Route
                path="/manager/cinemas"
                element={<CinemaManagementPage />}
              />

              <Route
                path="/manager/showtimes"
                element={<ShowtimeManagementPage />}
              />

            </Route>
          </Route>

          {/* ADMIN SYSTEM */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['ADMIN']}
              />
            }
          >
            <Route element={<AdminSystemLayout />}>

              <Route
                path="/admin"
                element={
                  <Navigate
                    to="/admin/role-permissions"
                    replace
                  />
                }
              />

              <Route
                path="/admin/role-permissions"
                element={<RolePermissionManagementPage />}
              />

              <Route
                path="/admin/users"
                element={<UserManagementPage />}
              />

            </Route>
          </Route>

          {/* NOT FOUND */}
          <Route
            path="*"
            element={
              <Navigate to="/" replace />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
