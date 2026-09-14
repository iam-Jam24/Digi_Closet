import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
