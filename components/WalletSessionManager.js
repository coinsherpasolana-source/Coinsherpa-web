import { useEffect, useRef, useState } from 'react';
import { isSessionExpired, getRemainingMs, DURATION_LABELS, DEFAULT_DURATION } from '../lib/walletSession';

const STORAGE_KEY = 'coinsherpa_wallet_session';

// WalletSessionManager: theo dõi phiên kết nối ví, tự ngắt đúng theo lựa chọn
// của người dùng. Lưu lựa chọn vào localStorage (không cần Supabase — đây là
// tùy chọn cục bộ trên thiết bị, không phải dữ liệu tài khoản nhạy cảm).
//
// LƯU Ý: onDisconnect hiện là placeholder — khi nối ví thật (Wallet Standard/
// Phantom adapter), truyền vào đúng hàm disconnect() của ví tại đây.
export default function WalletSessionManager({ connected, onDisconnect }) {
  const [durationKey, setDurationKey] = useState(DEFAULT_DURATION);
  const [connectedAt, setConnectedAt] = useState(null);
  const [remainingLabel, setRemainingLabel] = useState(null);
  const hasDisconnectedRef = useRef(false);

  // Khôi phục lựa chọn đã lưu
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.durationKey) setDurationKey(parsed.durationKey);
      } catch (e) { /* dữ liệu lưu bị hỏng -> bỏ qua, dùng mặc định */ }
    }
  }, []);

  useEffect(() => {
    if (connected && !connectedAt) {
      setConnectedAt(Date.now());
      hasDisconnectedRef.current = false;
    }
    if (!connected) {
      setConnectedAt(null);
    }
  }, [connected]);

  useEffect(() => {
    if (!connected || !connectedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (isSessionExpired(connectedAt, durationKey, now)) {
        if (!hasDisconnectedRef.current) {
          hasDisconnectedRef.current = true;
          onDisconnect?.();
        }
        clearInterval(interval);
        return;
      }
      const remainingMs = getRemainingMs(connectedAt, durationKey, now);
      if (remainingMs !== null) {
        const hours = Math.floor(remainingMs / 3600000);
        const minutes = Math.floor((remainingMs % 3600000) / 60000);
        setRemainingLabel(`${hours}g ${minutes}p`);
      } else {
        setRemainingLabel(null); // chế độ manual -> không hiện đếm ngược
      }
    }, 30000); // kiểm tra mỗi 30 giây, đủ nhanh mà không tốn tài nguyên

    return () => clearInterval(interval);
  }, [connected, connectedAt, durationKey, onDisconnect]);

  function handleChangeDuration(newKey) {
    setDurationKey(newKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ durationKey: newKey }));
  }

  if (!connected) return null;

  return (
    <div style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
      {remainingLabel && <span>Tự ngắt sau: {remainingLabel}</span>}
      <select
        value={durationKey}
        onChange={(e) => handleChangeDuration(e.target.value)}
        style={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: 6, padding: '2px 4px' }}
      >
        {Object.entries(DURATION_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  );
}
