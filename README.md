This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Turso Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Gemini API (AI解析)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL_NAME=gemini-2.0-flash-exp  # オプション: デフォルトは gemini-2.0-flash-exp
```

### モデルの変更について

`GEMINI_MODEL_NAME` 環境変数で使用するGeminiモデルを変更できます。利用可能なモデル例：
- `gemini-2.0-flash-exp` (デフォルト)
- `gemini-2.0-flash-lite`
- `gemini-1.5-pro`
- その他Gemini APIで利用可能なモデル

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
