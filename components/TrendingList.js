import Link from 'next/link';

function fmtUsd(n) {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

function fmtPrice(n) {
  if (!n) return 'N/A';
  return '$' + (n < 0.01 ? n.toFixed(8) : n.toFixed(4));
}

const RISK_COLOR = {
  safe: 'var(--teal)',
  neutral: 'var(--text-muted)',
  volatile: 'var(--primary)',
  danger: 'var(--red)',
  unknown: 'var(--text-dim)',
};

// TrendingList: danh sách token trending, dày thông tin (giống Axiom/Dexscreener)
// nhưng LUÔN hiện 2 cảnh báo song song — trendScore (có đang nóng thật không) và
// liquidityRisk (có dễ dump sâu không) — đây là điểm khác biệt cố ý của Coinsherpa.
export default function TrendingList({ tokens, chain = 'solana' }) {
  if (!tokens || tokens.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-dim)', padding: 16 }}>Chưa có dữ liệu trending.</p>;
  }

  return (
    <div>
      {tokens.map((t) => {
        const content = (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0, overflow: 'hidden' }}>
              {t.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.imageUrl} alt={t.symbol} width={36} height={36} style={{ objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>${t.symbol}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--primary)' }}>🔥 {t.trendScore}</span>
                <span style={{ fontSize: 10, color: RISK_COLOR[t.liquidityRisk?.level] || 'var(--text-dim)' }}>
                  ● {t.liquidityRisk?.level === 'safe' ? 'An toàn' : t.liquidityRisk?.level === 'danger' ? 'Báo động' : t.liquidityRisk?.level === 'volatile' ? 'Dễ bay' : t.liquidityRisk?.level === 'neutral' ? 'Trung tính' : 'N/A'}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtPrice(t.priceUsd)}</div>
              <div style={{ fontSize: 11, color: t.priceChangeH24 >= 0 ? 'var(--teal)' : 'var(--red)' }}>
                {t.priceChangeH24 >= 0 ? '+' : ''}{t.priceChangeH24?.toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>Vol {fmtUsd(t.volumeH24)}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>MC {fmtUsd(t.fdv)}</div>
            </div>
          </div>
        );

        // Nếu không trích được địa chỉ mint (dữ liệu GeckoTerminal thiếu relationships),
        // KHÔNG dẫn người dùng tới trang lỗi — hiện dạng không bấm được thay vì link hỏng.
        if (!t.mint) {
          return <div key={t.poolAddress} style={{ opacity: 0.6, cursor: 'not-allowed' }}>{content}</div>;
        }

        return (
          <Link key={t.poolAddress} href={`/token/${t.mint}?chain=${chain}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
