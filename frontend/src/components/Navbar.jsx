import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

export default function Navbar({ actions }) {
  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <div className="navbar__logo">
            <Scissors size={16} />
          </div>
          <span className="navbar__title">DIGI CLOSET</span>
        </Link>
        {actions && <div className="navbar__actions">{actions}</div>}
      </div>
    </nav>
  );
}
