import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import AuthLayout from '../layout/AuthLayout';
import MainLayout from '../layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Onboarding from '../pages/Onboarding';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Wardrobe from '../pages/Wardrobe';
import Products from '../pages/Products';
import OutfitRecommendations from '../pages/OutfitRecommendations';
import FashionCritic from '../pages/FashionCritic';
import ColorAnalyzer from '../pages/ColorAnalyzer';
import OccasionStyling from '../pages/OccasionStyling';
import ShoppingAssistant from '../pages/ShoppingAssistant';
import TryOn from '../pages/TryOn';
import Chatbot from '../pages/Chatbot';
import SavedItems from '../pages/SavedItems';
import Settings from '../pages/Settings';

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
        <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />
      </Route>

      {/* Onboarding (protected, but outside main sidebar layout) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

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
        <Route path="/outfits" element={<OutfitRecommendations />} />
        <Route path="/fashion-critic" element={<FashionCritic />} />
        <Route path="/colors" element={<ColorAnalyzer />} />
        <Route path="/styling/occasion" element={<OccasionStyling />} />
        <Route path="/shopping" element={<ShoppingAssistant />} />
        <Route path="/try-on" element={<TryOn />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/saved" element={<SavedItems />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
