'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main animate-fade-in">
          {/* Dedicated Top Navbar Header */}
          <div className="admin-top-header">
            <button
              onClick={logout}
              className="btn btn-outline flex items-center gap-2"
              style={{
                color: 'var(--text-secondary)',
                padding: '0.4rem 0.9rem',
                fontSize: '0.825rem',
                fontWeight: 500,
              }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
