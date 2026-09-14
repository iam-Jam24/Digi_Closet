import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

export default function Navbar({ actions }) {
  return (
    <nav className="w-full border-b border-brand-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center group-hover:bg-brand-800 transition-colors">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-brand-900 font-display tracking-tight">
              DIGI CLOSET
            </span>
          </Link>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
