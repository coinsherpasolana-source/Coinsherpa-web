# Coinsherpa Web

Nền tảng phân tích on-chain cho người Việt mới vào crypto trên Solana.

## Kiến trúc

- `pages/` — 3 giao diện persona (newbie/trader/kol) + trang chủ
- `pages/api/token-profile.js` — API server, giấu Helius API key an toàn
- `lib/tokenProfile.js` — module lõi tổng hợp dữ liệu (Helius + Dexscreener)
- `lib/chains.js` — đăng ký chain, thêm ETH/Base/BNB sau này chỉ cần sửa file này
- `locales/` — file ngôn ngữ vi.json / en.json, tách biệt khỏi code giao diện
- `components/TokenCard.js` — 1 component dùng chung cho cả 3 persona

## Cách chạy (trên GitHub Codespaces)

1. Mở repo này trong Codespaces
2. Copy `.env.example` thành `.env.local`, dán Helius API key thật vào
3. Chạy trong terminal:
   ```
   npm install
   npm run dev
   ```
4. Mở link Codespaces cung cấp, thêm `/newbie`, `/trader`, hoặc `/kol` vào cuối URL

## Deploy lên Vercel

1. Đẩy code lên GitHub (không đẩy `.env.local`, đã bị `.gitignore` chặn)
2. Trên Vercel, import repo này
3. Vào Project Settings → Environment Variables → thêm `HELIUS_API_KEY` với key thật
4. Deploy — Vercel tự nhận đây là dự án Next.js, không cần cấu hình gì thêm
