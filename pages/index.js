import Link from 'next/link';
import { getDictionary } from '../lib/i18n';

const dict = getDictionary('vi');

export default function HomePage() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>{dict.brand.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{dict.brand.tagline}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href="/newbie" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          🌱 {dict.persona.newbie}
        </Link>
        <Link href="/trader" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          📊 {dict.persona.trader}
        </Link>
        <Link href="/kol" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          🎤 {dict.persona.kol}
        </Link>
      </div>
    </main>
  );
}
