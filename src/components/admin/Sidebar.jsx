'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';
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
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo size={24} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            ZeroAxiis
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
              <item.icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-link w-full text-left flex items-center gap-2"
          onClick={logout}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
