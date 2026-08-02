import Link from 'next/link';

export default function Header() {
  return (
    <header className="public-header">
      <div className="header-inner">
        <Link href="/">
          <h2 className="heading-md" style={{ marginBottom: 0, color: 'var(--accent)' }}>
            ZeroAxiis
          </h2>
        </Link>
        <nav className="header-nav">
          <a href="#services">Services</a>
          <a href="#team">Team</a>
          <Link href="/admin/login" className="btn btn-outline btn-sm">
            Admin Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
