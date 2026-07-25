import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#0B132F' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-5 pt-20 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
