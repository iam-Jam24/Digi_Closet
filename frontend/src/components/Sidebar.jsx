import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Shirt,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  Dna,
  Lightbulb,
  LogOut,
  X,
  Scissors,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'My Profile', icon: User },
  { to: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { to: '/products', label: 'Products', icon: ShoppingBag },
];

const comingSoonItems = [
  { to: '/try-on', label: 'Try-On', icon: Sparkles },
  { to: '/fashion-critic', label: 'Fashion Critic', icon: MessageSquare },
  { to: '/ai-dna', label: 'AI DNA', icon: Dna },
  { to: '/ai-advisor', label: 'AI Advisor', icon: Lightbulb },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose?.();
  };

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-brand-900 text-white shadow-sm'
        : 'text-brand-600 hover:bg-brand-100 hover:text-brand-900'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-white border-r border-brand-100
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-brand-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-brand-900 font-display tracking-tight">
              DIGI CLOSET
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-brand-400 hover:text-brand-600 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Main navigation */}
          {mainNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClasses}
              onClick={onClose}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}

          {/* Coming Soon separator */}
          <div className="pt-4 pb-2">
            <p className="px-3 text-[11px] font-semibold text-brand-400 uppercase tracking-wider">
              Coming Soon
            </p>
          </div>

          {comingSoonItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClasses}
              onClick={onClose}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
              <Lock className="w-3 h-3 ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-brand-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar name={user?.name || ''} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-brand-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-brand-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
