import { useState, useEffect } from 'react';
import TokenCard from '../components/TokenCard';
import TrendingList from '../components/TrendingList';
import { getDictionary } from '../lib/i18n';

const dict = getDictionary('vi');

export default function NewbiePage() {
  const [mint, setMint] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);

  useEffect(() => {
    fetch('/api/trending?chain=solana')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTrending(data.tokens || []);
      })
      .catch((err) => setTrendingError(err.message))
      .finally(() => setTrendingLoading(false));
  }, []);

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

      {/* Danh sách Trending — mở web là thấy dữ liệu ngay, không phải màn hình trống */}
      {!profile && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>
            🔥 Đang Trending — Solana
          </div>
          {trendingLoading && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Đang tải…</p>}
          {trendingError && <p style={{ fontSize: 13, color: 'var(--red)' }}>{trendingError}</p>}
          {!trendingLoading && !trendingError && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <TrendingList tokens={trending.slice(0, 20)} chain="solana" />
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 24 }}>{dict.disclaimer}</p>
    </main>
  );
}
