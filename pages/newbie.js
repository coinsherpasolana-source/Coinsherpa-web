import { useState } from 'react';
import TokenCard from '../components/TokenCard';
import { getDictionary } from '../lib/i18n';

const dict = getDictionary('vi');

export default function NewbiePage() {
  const [mint, setMint] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheck() {
    if (!mint.trim()) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await fetch(`/api/token-profile?mint=${mint.trim()}&chain=solana`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{dict.brand.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{dict.brand.tagline}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          placeholder={dict.common.pasteAddress}
          style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10 }}
        />
        <button
          onClick={handleCheck}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, width: '100%' }}
        >
          {dict.common.checkToken}
        </button>
      </div>

      {loading && <p>{dict.common.loading}</p>}
      {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
      {profile && <TokenCard profile={profile} level="simple" dict={dict} />}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 24 }}>{dict.disclaimer}</p>
    </main>
  );
}
