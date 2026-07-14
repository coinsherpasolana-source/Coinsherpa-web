import { useEffect, useState } from 'react';

export default function WatchlistPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/watchlist')
      .then((r) => r.json().then((body) => ({ status: r.status, body })))
      .then(({ status, body }) => setData({ status, body }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Danh sách theo dõi</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Lưu coin yêu thích vào thư mục riêng, tối đa 100 coin/thư mục
      </p>

      {loading && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Đang tải…</p>}

      {!loading && data?.status === 401 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, marginBottom: 10 }}>🔒 {data.body.error}</div>
          <a
            href="/login"
            style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
          >
            Đăng nhập ngay
          </a>
        </div>
      )}

      {!loading && data?.status === 200 && (
        <div>
          {data.body.folders.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Chưa có thư mục nào — tạo thư mục đầu tiên của bạn.</p>
          ) : (
            data.body.folders.map((f) => <div key={f.id} className="card">{f.name}</div>)
          )}
        </div>
      )}
    </main>
  );
}
