import { useState, useRef } from 'react';
import { shortenAddress } from '../lib/formatAddress';

// CopyableAddress: hiện CA rút gọn + nút copy ngay sát đuôi. Đặt ngay dưới icon
// token để dễ xem/dễ copy, đúng yêu cầu.
export default function CopyableAddress({ address }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
    } catch (e) {
      // Trình duyệt cũ/không hỗ trợ clipboard API -> vẫn không crash, chỉ không copy được
      console.warn('Không thể copy:', e);
      return;
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current); // bấm liên tục -> reset đồng hồ, không chồng chéo
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  if (!address) return null;

  return (
    <div
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)',
        background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 6,
        border: '1px solid var(--border)',
      }}
      title="Bấm để copy địa chỉ đầy đủ"
    >
      <span>{shortenAddress(address)}</span>
      <span style={{ color: copied ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 600 }}>
        {copied ? '✓ Đã copy' : '📋'}
      </span>
    </div>
  );
}
