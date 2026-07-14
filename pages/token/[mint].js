import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InfoTooltipIcon from '../../components/InfoTooltipIcon';
import DuplicateTickerPanel from '../../components/DuplicateTickerPanel';
import PriceChart from '../../components/PriceChart';
import CopyableAddress from '../../components/CopyableAddress';

// Ánh xạ chain -> ký hiệu hiển thị trên icon (thay cho ảnh logo thật, dùng chữ viết tắt tạm thời)
const CHAIN_ICON_TEXT = { solana: 'SOL', ethereum: 'ETH', base: 'BASE', bnb: 'BNB' };
const CHAIN_DESCRIPTIONS = {
  solana: 'Blockchain tốc độ cao, phí giao dịch cực rẻ — nơi phần lớn memecoin hiện nay được tạo ra.',
};

export default function TokenProfilePage() {
  const router = useRouter();
  const { mint, chain } = router.query;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mint) return;
    setLoading(true);
    setError(null);
    fetch(`/api/token-profile?mint=${mint}&chain=${chain || 'solana'}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mint, chain]);

  if (loading) return <main style={{ padding: 20 }}>Đang tải…</main>;
  if (error) return <main style={{ padding: 20, color: 'var(--red)' }}>{error}</main>;
  if (!profile) return null;

  const { market, chain: chainId, duplicateTickers } = profile;
  const chainLabel = chainId === 'solana' ? 'Solana' : chainId;

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 12, fontSize: 13 }}
      >
        ← Quay lại
      </button>

      <h1 style={{ fontSize: 22, marginBottom: 6 }}>${market?.symbol || '???'}</h1>
      <div style={{ marginBottom: 12 }}>
        <CopyableAddress address={profile.mint} />
      </div>

      {/* Mục 1: Chain */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <InfoTooltipIcon
          iconText={CHAIN_ICON_TEXT[chainId] || chainId}
          label={chainLabel}
          description={CHAIN_DESCRIPTIONS[chainId] || 'Blockchain nơi token này được tạo ra.'}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{chainLabel}</span>

        {/* Mục 2: Launchpad */}
        {market?.launchpad && (
          <>
            <InfoTooltipIcon
              iconText={market.launchpad.label.slice(0, 2).toUpperCase()}
              label={market.launchpad.label}
              description={market.launchpad.description}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{market.launchpad.label}</span>
          </>
        )}
        {!market?.launchpad && market?.dexIdRaw && (
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            (Chưa nhận diện launchpad: {market.dexIdRaw})
          </span>
        )}
      </div>

      {/* Mục 3: Thời gian tạo + ticker trùng tên */}
      <DuplicateTickerPanel
        symbol={market?.symbol}
        pairCreatedAt={market?.pairCreatedAt}
        duplicateData={duplicateTickers}
        chain={chainId}
      />

      {/* Ví Dev — cần đăng nhập mới xem được, đúng chính sách đã thống nhất */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Ví Dev</div>
        {profile.devWalletInfo?.locked ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔒 {profile.devWalletInfo.reason}
            <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng nhập</a>
          </div>
        ) : profile.devWalletInfo?.devWallet ? (
          <div style={{ fontSize: 12.5 }}>
            <div>Địa chỉ: <span style={{ fontFamily: 'monospace' }}>{profile.devWalletInfo.devWallet}</span></div>
            <div style={{ marginTop: 4 }}>Số token đã tạo: {profile.devWalletInfo.totalTokensCreated ?? 'N/A'}</div>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{profile.devWalletInfo?.reason || 'Không xác định'}</div>
        )}
      </div>

      {/* Bảng thống kê nhanh */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Giá</div>
            <div style={{ fontWeight: 700 }}>{market?.priceUsd ? `$${market.priceUsd.toFixed(8)}` : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>FDV</div>
            <div style={{ fontWeight: 700 }}>{market?.fdv ? `$${Math.round(market.fdv).toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Vốn hóa (Mcap)</div>
            <div style={{ fontWeight: 700 }}>{market?.marketCap ? `$${Math.round(market.marketCap).toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Volume 24h</div>
            <div style={{ fontWeight: 700 }}>{market?.volume?.h24 ? `$${Math.round(market.volume.h24).toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Tổng token đã mint</div>
            <div style={{ fontWeight: 700 }}>{profile.security?.totalSupply ? Math.round(profile.security.totalSupply).toLocaleString() : 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Thanh khoản</div>
            <div style={{ fontWeight: 700 }}>{market?.liquidityUsd ? `$${Math.round(market.liquidityUsd).toLocaleString()}` : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ giá thật — nến, volume, chỉ báo */}
      {market?.pairAddress && (
        <div style={{ marginTop: 12 }}>
          <PriceChart pairAddress={market.pairAddress} chain={chainId} userTier="free" />
        </div>
      )}
    </main>
  );
}
