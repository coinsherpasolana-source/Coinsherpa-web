import { useState, useRef, useEffect } from 'react';

// InfoTooltipIcon: dùng cho cả icon Chain (mục 1) và icon Launchpad (mục 2).
// Bấm vào icon -> hiện tab nhỏ giải thích. Bấm ra ngoài bất kỳ đâu -> tự ẩn.
export default function InfoTooltipIcon({ iconText, label, description }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <span ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Giải thích ${label}`}
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {iconText}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 20,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 12px', width: 220,
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)', fontSize: 12.5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</div>
        </div>
      )}
    </span>
  );
}
