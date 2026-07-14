import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCompactPrice, formatCompactNumber, formatAge } from '../lib/formatDisplay';

const RISK_COLOR = {
  safe: 'var(--teal)', neutral: 'var(--text-muted)',
  volatile: 'var(--primary)', danger: 'var(--red)', unknown: 'var(--text-dim)',
};

const TRENDING_TIMEFRAMES = [
  { key: '5m', label: '5 phút' },
  { key: '1h', label: '1 giờ' },
  { key: '6h', label: '6 giờ' },
  { key: '24h', label: '24 giờ' },
];
const NEW_WINDOWS = [
  { key: '1h', label: '1 giờ qua' },
  { key: '6h', label: '6 giờ qua' },
  { key: '24h', label: '24 giờ qua' },
];
const TOP_SORTS = [
  { key: 'volume', label: 'Theo Volume' },
  { key: 'txns', label: 'Theo Giao dịch' },
];

function PriceDisplay({ price }) {
  const p = formatCompactPrice(price);
  if (p.type === 'na') return <span>N/A</span>;
  if (p.type === 'subscript') {
    return <span>$0.0<sub style={{ fontSize: 9 }}>{p.zeros}</sub>{p.digits}</span>;
  }
  return <span>{p.text}</span>;
}

// TrendingList: tab Trending/New/Top, mỗi tab có bảng lựa chọn con hiện ở chân trang.
// GHI CHÚ TRUNG THỰC: khung "5 phút" và "6 giờ" của Trending là XẤP XỈ (dùng dữ liệu
// 1h/24h sẵn có), vì GeckoTerminal (nguồn miễn phí) không trả về đúng 2 khung này.
export default function TrendingList({ chain = 'solana' }) {
  const [activeTab, setActiveTab] = useState('trending');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trendingTf, setTrendingTf] = useState('24h');
  const [newWindow, setNewWindow] = useState('24h');
  const [topSort, setTopSort] = useState('volume');

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(100);

  async function loadTokens(mode, sortBy, desiredCount) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ chain, mode, sortBy: sortBy || 'volume', count: String(desiredCount) });
      const res = await fetch(`/api/trending?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTokens(data.tokens || []);
      setCount(desiredCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTokens('trending', 'volume', 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabClick(tab) {
    setActiveTab(tab);
    setPickerOpen(true);
  }

  function applyTrendingTf(tf) {
    setTrendingTf(tf);
    setPickerOpen(false);
    loadTokens('trending', 'volume', count);
  }
  function applyNewWindow(w) {
    setNewWindow(w);
    setPickerOpen(false);
    loadTokens('new', 'volume', count);
  }
  function applyTopSort(s) {
    setTopSort(s);
    setPickerOpen(false);
    loadTokens('top', s, count);
  }

  function handleLoadMore() {
    const mode = activeTab;
    const sortBy = mode === 'top' ? topSort : 'volume';
    loadTokens(mode, sortBy, 200);
  }

  const displayTokens =
    activeTab === 'trending'
      ? [...tokens].sort((a, b) => {
          const field = trendingTf === '5m' || trendingTf === '1h' ? 'priceChangeH1' : 'priceChangeH24';
          return (b[field] || 0) - (a[field] || 0);
        })
      : activeTab === 'new'
      ? tokens.filter((t) => {
          const windowMs = { '1h': 3600000, '6h': 21600000, '24h': 86400000 }[newWindow];
          return t.poolCreatedAt && Date.now() - t.poolCreatedAt <= windowMs;
        })
      : tokens;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[
          { key: 'trending', label: activeTab === 'trending' ? `🔥 Trending ${trendingTf}` : 'Trending' },
          { key: 'new', label: activeTab === 'new' ? `🌱 New ${newWindow}` : 'New' },
          { key: 'top', label: activeTab === 'top' ? `📊 Top` : 'Top' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            style={{
              flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: activeTab === tab.key ? 'none' : '1px solid var(--border)',
              background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface-2)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ fontSize: 13, color: 'var(--text-dim)', padding: 16 }}>Đang tải…</p>}
      {error && <p style={{ fontSize: 13, color: 'var(--red)', padding: 16 }}>{error}</p>}

      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {displayTokens.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', padding: 16 }}>Không có dữ liệu.</p>
          )}
          {displayTokens.map((t) => {
            const age = formatAge(t.poolCreatedAt);
            const content = (
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      {t.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.imageUrl} alt={t.symbol} width={36} height={36} style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                    <span style={{ position: 'absolute', bottom: -3, left: -3, fontSize: 7, fontWeight: 700, background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '1px 3px' }}>
                      SOL
                    </span>
                    {t.dexLabel && (
                      <span style={{ position: 'absolute', bottom: -3, right: -3, fontSize: 7, fontWeight: 700, background: 'var(--teal)', color: '#fff', borderRadius: 4, padding: '1px 3px', maxWidth: 30, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {t.dexLabel}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{t.symbol}</span>
                      {age && (
                        <span style={{ fontSize: 10, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          🌱{age}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{t.name?.split('/')[0]?.trim() || ''}</div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}><PriceDisplay price={t.priceUsd} /></div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', fontSize: 10.5 }}>
                      <span style={{ color: t.priceChangeH1 >= 0 ? 'var(--teal)' : 'var(--red)' }}>
                        1h {t.priceChangeH1 >= 0 ? '+' : ''}{t.priceChangeH1?.toFixed(1)}%
                      </span>
                      <span style={{ color: t.priceChangeH24 >= 0 ? 'var(--teal)' : 'var(--red)' }}>
                        24h {t.priceChangeH24 >= 0 ? '+' : ''}{t.priceChangeH24?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10.5, color: 'var(--text-dim)' }}>
                  <span>LIQ {formatCompactNumber(t.liquidityUsd)}</span>
                  <span>VOL {formatCompactNumber(t.volumeH24)}</span>
                  <span>MCAP {formatCompactNumber(t.fdv)}</span>
                  <span style={{ color: RISK_COLOR[t.liquidityRisk?.level] || 'var(--text-dim)', marginLeft: 'auto' }}>
                    ● {t.liquidityRisk?.level === 'safe' ? 'An toàn' : t.liquidityRisk?.level === 'danger' ? 'Báo động' : t.liquidityRisk?.level === 'volatile' ? 'Dễ bay' : t.liquidityRisk?.level === 'neutral' ? 'Trung tính' : 'N/A'}
                  </span>
                </div>
              </div>
            );

            if (!t.mint) return <div key={t.poolAddress} style={{ opacity: 0.6, cursor: 'not-allowed' }}>{content}</div>;
            return (
              <Link key={t.poolAddress} href={`/token/${t.mint}?chain=${chain}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {content}
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && count < 200 && displayTokens.length >= 90 && (
        <button
          onClick={handleLoadMore}
          style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Xem thêm 100 token (101-200)
        </button>
      )}

      {pickerOpen && (
        <div
          onClick={() => setPickerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', background: 'var(--surface)', borderRadius: '16px 16px 0 0', padding: 16, maxWidth: 480, margin: '0 auto' }}
          >
            {activeTab === 'trending' && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Khung thời gian Trending</div>
                {TRENDING_TIMEFRAMES.map((tf) => (
                  <button key={tf.key} onClick={() => applyTrendingTf(tf.key)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 8px', border: 'none', background: trendingTf === tf.key ? 'var(--primary-dim)' : 'transparent', color: trendingTf === tf.key ? 'var(--primary)' : 'var(--text)', fontWeight: trendingTf === tf.key ? 700 : 400, borderRadius: 8, cursor: 'pointer' }}>
                    {tf.label}
                  </button>
                ))}
              </>
            )}
            {activeTab === 'new' && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Token mới trong</div>
                {NEW_WINDOWS.map((w) => (
                  <button key={w.key} onClick={() => applyNewWindow(w.key)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 8px', border: 'none', background: newWindow === w.key ? 'var(--primary-dim)' : 'transparent', color: newWindow === w.key ? 'var(--primary)' : 'var(--text)', fontWeight: newWindow === w.key ? 700 : 400, borderRadius: 8, cursor: 'pointer' }}>
                    {w.label}
                  </button>
                ))}
              </>
            )}
            {activeTab === 'top' && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Xếp hạng Top theo</div>
                {TOP_SORTS.map((s) => (
                  <button key={s.key} onClick={() => applyTopSort(s.key)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 8px', border: 'none', background: topSort === s.key ? 'var(--primary-dim)' : 'transparent', color: topSort === s.key ? 'var(--primary)' : 'var(--text)', fontWeight: topSort === s.key ? 700 : 400, borderRadius: 8, cursor: 'pointer' }}>
                    {s.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
