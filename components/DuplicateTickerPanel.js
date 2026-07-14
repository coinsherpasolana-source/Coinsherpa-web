import { useState } from 'react';
import { useRouter } from 'next/router';

function formatDate(ms) {
  const d = new Date(ms);
  return d.toLocaleString('vi-VN', { hour12: false });
}

// DuplicateTickerPanel: mục 3 — thời gian tạo + lịch sử ticker trùng tên.
// Bấm vào 1 token khác trong danh sách -> điều hướng tới hồ sơ token đó.
// Nút "Quay lại" dùng router.back() -> về đúng token trước đó, đúng yêu cầu.
export default function DuplicateTickerPanel({ symbol, pairCreatedAt, duplicateData, chain }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!pairCreatedAt) return null;

  function goToToken(mint) {
    router.push(`/token/${mint}?chain=${chain}`);
    setOpen(false);
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Thời gian tạo</div>
          <div style={{ fontWeight: 600 }}>{formatDate(pairCreatedAt)}</div>
        </div>
        {duplicateData && (
          <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
            Lần thứ {duplicateData.currentOccurrence ?? '?'} / {duplicateData.totalCount} token ${symbol} →
          </span>
        )}
      </div>

      {open && duplicateData && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
            ⚠ Danh sách này chỉ dựa trên dữ liệu tìm kiếm được, có thể không đầy đủ 100% lịch sử mint thật.
          </div>
          {duplicateData.list.map((item) => (
            <div
              key={item.pairAddress}
              onClick={() => !item.isCurrent && goToToken(item.mint)}
              style={{
                padding: '8px 10px', borderRadius: 6, marginBottom: 4,
                background: item.isCurrent ? 'var(--primary-dim)' : 'var(--surface-2)',
                cursor: item.isCurrent ? 'default' : 'pointer',
                fontSize: 12.5, display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>
                #{item.occurrence} — {formatDate(item.createdAt)}
                {item.isCurrent && ' (đang xem)'}
              </span>
              {!item.isCurrent && <span style={{ color: 'var(--primary)' }}>Xem →</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
