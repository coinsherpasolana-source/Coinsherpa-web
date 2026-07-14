import { useState } from 'react';
import { signIn } from '../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    setMessage(result.success ? 'Đăng nhập thành công!' : result.reason);
  }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 40 }}>
      <h1 style={{ fontSize: 22, marginBottom: 20, textAlign: 'center' }}>Đăng nhập Coinsherpa</h1>

      <form onSubmit={handleSubmit} className="card">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          {loading ? 'Đang xử lý…' : 'Đăng nhập'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}>{message}</p>
      )}
    </main>
  );
}
