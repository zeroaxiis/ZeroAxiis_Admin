'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  Video,
  MessageSquareQuote,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/blogs', label: 'Blogs', icon: FileText },
  { href: '/admin/team', label: 'Team', icon: Users },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/creatives', label: 'Creatives', icon: Video },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <Link href="/admin">
          <h1 className="heading-md" style={{ color: 'var(--accent)' }}>
            ZeroAxiis
          </h1>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            Admin Panel
          </span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-link w-full" onClick={logout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
