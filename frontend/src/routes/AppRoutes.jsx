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
import OutfitRecommendations from '../pages/OutfitRecommendations';
import FashionCritic from '../pages/FashionCritic';
import ColorAnalyzer from '../pages/ColorAnalyzer';
import SmartRecommendations from '../pages/SmartRecommendations';
import ClothesFinder from '../pages/ClothesFinder';
import BudgetPlanner from '../pages/BudgetPlanner';
import LocationFinds from '../pages/LocationFinds';
import TryOn from '../pages/TryOn';
import StyleMakeover from '../pages/StyleMakeover';
import OutfitPlanner from '../pages/OutfitPlanner';
import WardrobeInsights from '../pages/WardrobeInsights';
import Chatbot from '../pages/Chatbot';
import SavedItems from '../pages/SavedItems';
import Settings from '../pages/Settings';

function RedirectIfAuth({ children }) {
  const { isAuthenticated, loading, authInProgress } = useAuth();
  if (loading) return null;
  if (isAuthenticated && !authInProgress) return <Navigate to="/dashboard" replace />;
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
        <Route path="/outfits" element={<OutfitRecommendations />} />
        <Route path="/recommendations" element={<SmartRecommendations />} />
        <Route path="/fashion-critic" element={<FashionCritic />} />
        <Route path="/colors" element={<ColorAnalyzer />} />
        <Route path="/shopping/finder" element={<ClothesFinder />} />
        <Route path="/shopping/budget" element={<BudgetPlanner />} />
        <Route path="/location-finds" element={<LocationFinds />} />

        {/* Old URLs from before the pages were consolidated */}
        <Route path="/wardrobe/analyzer" element={<Navigate to="/wardrobe" replace />} />
        <Route path="/styling/occasion" element={<Navigate to="/recommendations" replace />} />
        <Route path="/products" element={<Navigate to="/shopping/finder" replace />} />
        <Route path="/shopping/assistant" element={<Navigate to="/shopping/finder" replace />} />
        <Route path="/shopping" element={<Navigate to="/shopping/budget" replace />} />
        <Route path="/try-on" element={<TryOn />} />
        <Route path="/makeover" element={<StyleMakeover />} />
        <Route path="/planner" element={<OutfitPlanner />} />
        <Route path="/insights" element={<WardrobeInsights />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/saved" element={<SavedItems />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
