import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import Wordmark from '../components/Wordmark';

const TOP_LINKS = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/wardrobe', label: 'Wardrobe' },
  { to: '/chat', label: 'AI Stylist' },
  { to: '/shopping/finder', label: 'Discover' },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, firebaseUser } = useAuth();
  const firstName = (user?.name || firebaseUser?.displayName || '').trim().split(' ')[0];

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-layout__content">
        <header className="topbar">
          <button className="topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <Wordmark to="/dashboard" className="topbar__mark" />
          <nav className="topbar__links" aria-label="Quick links">
            {TOP_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `topbar__link ${isActive ? 'is-active' : ''}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="topbar__actions">
            <Link to="/saved" className="topbar__icon" aria-label="Saved items"><Heart size={20} strokeWidth={1.4} /></Link>
            {/* First name only, so the avatar shows one initial ("J"). */}
            <Link to="/profile" className="topbar__profile" aria-label="Your profile">
              {firstName && <span className="topbar__profile-name">{firstName}</span>}
              <Avatar name={firstName} size="sm" />
            </Link>
          </div>
        </header>

        <main className="main-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
