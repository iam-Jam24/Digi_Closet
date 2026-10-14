import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Shirt, ShoppingBag, Sparkles,
  Wand2, Palette, CalendarHeart, Wallet, Camera, Bot, Heart, Settings, LogOut, X,
  Scissors,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const navGroups = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/wardrobe', label: 'Wardrobe', icon: Shirt },
    ],
  },
  {
    label: 'AI Styling',
    items: [
      { to: '/outfits', label: 'Outfit Recommendations', icon: Wand2 },
      { to: '/styling/occasion', label: 'Occasion Styling', icon: CalendarHeart },
      { to: '/colors', label: 'Color Analyzer', icon: Palette },
      { to: '/fashion-critic', label: 'Fashion Critic', icon: Sparkles },
      { to: '/chat', label: 'Fashion Chatbot', icon: Bot },
    ],
  },
  {
    label: 'Shopping',
    items: [
      { to: '/products', label: 'Clothes Finder', icon: ShoppingBag },
      { to: '/shopping', label: 'Budget Assistant', icon: Wallet },
      { to: '/saved', label: 'Saved Items', icon: Heart },
    ],
  },
  {
    label: 'Try-On',
    items: [
      { to: '/try-on', label: 'Virtual Try-On', icon: Camera },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'My Profile', icon: User },
      { to: '/settings', label: 'Settings & Privacy', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, firebaseUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onClose?.();
  };

  const linkClass = ({ isActive }) =>
    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`;

  return (
    <>
      {isOpen && <div className="sidebar__backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="navbar__brand">
            <div className="navbar__logo"><Scissors size={16} /></div>
            <span className="navbar__title">DIGI CLOSET</span>
          </div>
          <button className="sidebar__close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              {group.label && <p className="sidebar__section-label">{group.label}</p>}
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <Avatar name={user?.name || firebaseUser?.displayName || ''} size="sm" />
            <div style={{ minWidth: 0 }}>
              <p className="sidebar__user-name">{user?.name || firebaseUser?.displayName || 'User'}</p>
              <p className="sidebar__user-email">{user?.email || firebaseUser?.email}</p>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
