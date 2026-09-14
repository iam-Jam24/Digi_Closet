import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import AuthLayout from '../layout/AuthLayout';
import MainLayout from '../layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Wardrobe from '../pages/Wardrobe';
import Products from '../pages/Products';
import ComingSoon from '../pages/ComingSoon';

function RedirectIfAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <Login />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuth>
              <Register />
            </RedirectIfAuth>
          }
        />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/products" element={<Products />} />

        {/* Coming Soon pages */}
        <Route path="/try-on" element={<ComingSoon />} />
        <Route path="/fashion-critic" element={<ComingSoon />} />
        <Route path="/ai-dna" element={<ComingSoon />} />
        <Route path="/ai-advisor" element={<ComingSoon />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
