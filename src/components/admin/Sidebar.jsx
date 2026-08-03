'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  Video,
  MessageSquareQuote,
  User,
  ShieldCheck,
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

      {/* Static Unclickable Admin Profile Section */}
      <div className="sidebar-footer">
        <div
          className="flex items-center gap-3 p-2.5 rounded-lg"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <User size={15} style={{ color: 'var(--accent)' }} />
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <span>Administrator</span>
              <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="truncate">
              ZeroAxiis Admin
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
