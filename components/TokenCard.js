// TokenCard hiển thị 1 hồ sơ token (dữ liệu từ /api/token-profile).
// prop "level" quyết định độ sâu hiển thị — đây là cách 3 persona
// dùng chung 1 component mà không cần viết 3 lần:
//   "simple"  -> Người mới: chỉ đèn màu rủi ro + giá
//   "trader"  -> Trader: đầy đủ số liệu thị trường
//   "kol"     -> KOL/Dev: tập trung phần bảo mật + holder

export default function TokenCard({ profile, level = 'simple', dict }) {
  if (!profile) return null;

  const { market, security, holder } = profile;
  const riskLevel = security?.riskLevel === 'danger'
    ? 'danger'
    : holder?.riskLevel || 'caution';

  const riskLabel = {
    safe: dict.risk.safe,
    caution: dict.risk.caution,
    danger: dict.risk.danger,
  }[riskLevel];

  const riskClass = `badge-${riskLevel}`;

  // ---- Mức "simple" (Người mới): tối giản nhất ----
  if (level === 'simple') {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>${market?.symbol || '???'}</strong>
          <span className={riskClass} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
            {riskLabel}
          </span>
        </div>
        <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>
          {market?.priceUsd ? `$${market.priceUsd.toFixed(8)}` : 'N/A'}
        </div>
      </div>
    );
  }

  // ---- Mức "trader": đầy đủ số liệu thị trường ----
  if (level === 'trader') {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>${market?.symbol || '???'}</strong>
          <span className={riskClass} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
            {riskLabel}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{dict.common.price}</div>
            <div>{market?.priceUsd ? `$${market.priceUsd.toFixed(8)}` : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{dict.common.fdv}</div>
            <div>{market?.fdv ? `$${Math.round(market.fdv).toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{dict.common.marketCap}</div>
            <div>{market?.marketCap ? `$${Math.round(market.marketCap).toLocaleString()}` : 'N/A'}</div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Mức "kol": tập trung bảo mật + holder ----
  return (
    <div className="card">
      <strong>${market?.symbol || '???'}</strong>
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <div>Mint authority: {security?.mintAuthorityOpen ? dict.risk.mintOpen : dict.risk.mintLocked}</div>
        <div>Freeze authority: {security?.freezeAuthorityOpen ? dict.risk.freezeOpen : dict.risk.freezeLocked}</div>
        <div>Top 10 holders: {holder?.top10HolderPct !== undefined ? `${holder.top10HolderPct}%` : 'N/A'}</div>
      </div>
    </div>
  );
}
