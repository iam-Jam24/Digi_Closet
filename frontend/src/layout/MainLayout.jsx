import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-layout__content">
        <header className="main-layout__mobile-header">
          <div className="main-layout__mobile-header-inner">
            <button className="main-layout__menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <span className="main-layout__mobile-title">DIGI CLOSET</span>
            <div style={{ width: '2.25rem' }} />
          </div>
        </header>

        <main className="main-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
