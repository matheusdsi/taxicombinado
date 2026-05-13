import Link from 'next/link';

export function LegalFooter() {
  return (
    <div style={{
      maxWidth: 672, margin: '0 auto',
      padding: '16px 16px 100px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 12px' }}>
        {[
          { href: '/termos', label: 'Termos de Uso' },
          { href: '/privacidade', label: 'Privacidade' },
          { href: '/cookies', label: 'Cookies' },
          { href: '/sobre', label: 'Sobre' },
        ].map((l) => (
          <Link key={l.href} href={l.href} style={{ fontSize: 11, color: 'var(--gray-400)', textDecoration: 'none' }}>
            {l.label}
          </Link>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--gray-300)', textAlign: 'center' }}>
        © {new Date().getFullYear()} Taxi Combinado · Em conformidade com a LGPD
      </p>
    </div>
  );
}
