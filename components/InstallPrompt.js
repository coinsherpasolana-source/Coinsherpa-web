import { useEffect, useState, useRef } from 'react';

// InstallPrompt: khi trình duyệt xác định web đủ điều kiện cài (có manifest hợp lệ,
// HTTPS, service worker...), nó tự bắn sự kiện "beforeinstallprompt". Component này
// chặn banner mặc định (thường xấu, không kiểm soát được) và tự vẽ banner riêng.
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const deferredEventRef = useRef(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      deferredEventRef.current = event;
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstallClick() {
    if (!deferredEventRef.current) return;
    deferredEventRef.current.prompt();
    await deferredEventRef.current.userChoice;
    deferredEventRef.current = null;
    setVisible(false);
  }

  function handleDismiss() {
    setVisible(false); // chỉ ẩn lần này, không xóa sự kiện — vẫn cài được nếu user quay lại
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 100,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Cài Coinsherpa vào màn hình chính?</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Mở nhanh như 1 app, không cần mở trình duyệt</div>
      </div>
      <button
        onClick={handleDismiss}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', padding: 6 }}
      >
        Bỏ qua
      </button>
      <button
        onClick={handleInstallClick}
        style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
      >
        Cài đặt
      </button>
    </div>
  );
}
