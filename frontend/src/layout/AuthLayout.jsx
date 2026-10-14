import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
