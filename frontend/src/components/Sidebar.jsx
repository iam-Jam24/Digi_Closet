import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Shirt, Wand2, Camera, WandSparkles, Palette, Sparkles, MessageCircle,
  Search, CloudSun, Wallet, MapPinned, CalendarDays, ChartNoAxesColumn, Heart, User, Settings, LogOut, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Wordmark from './Wordmark';

const navGroups = [
  {
    label: 'Your space',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
      { to: '/wardrobe', label: 'My Wardrobe', icon: Shirt },
      { to: '/saved', label: 'Saved Looks', icon: Heart },
    ],
  },
  {
    label: 'AI Studio',
    items: [
      { to: '/outfits', label: 'Outfit Generator', icon: Wand2 },
      { to: '/try-on', label: 'Virtual Try-On', icon: Camera },
      { to: '/makeover', label: 'Style Makeover', icon: WandSparkles },
      { to: '/colors', label: 'Colour Palette', icon: Palette },
      { to: '/chat', label: 'AI Stylist', icon: MessageCircle },
      { to: '/fashion-critic', label: 'Fashion Critic', icon: Sparkles },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/shopping/finder', label: 'Clothes Finder', icon: Search },
      { to: '/recommendations', label: 'Weather Looks', icon: CloudSun },
      { to: '/shopping/budget', label: 'Budget Planner', icon: Wallet },
      { to: '/location-finds', label: 'Location Finds', icon: MapPinned },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/planner', label: 'Outfit Calendar', icon: CalendarDays },
      { to: '/insights', label: 'Wardrobe Insights', icon: ChartNoAxesColumn },
    ],
  },
];

const accountLinks = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onClose?.();
  };

  const link = ({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} onClick={onClose}>
      <Icon size={15} strokeWidth={1.4} />
      {label}
    </NavLink>
  );

  return (
    <>
      {isOpen && <div className="sidebar__backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Studio navigation">
        <div className="sidebar__header">
          <Wordmark to="/dashboard" />
          <button className="sidebar__close" onClick={onClose} aria-label="Close menu">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="sidebar__nav custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar__group">
              <p className="sidebar__section-label">{group.label}</p>
              {group.items.map(link)}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          {accountLinks.map(link)}
          <button className="sidebar__link sidebar__logout" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.4} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
