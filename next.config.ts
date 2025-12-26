import type { NextConfig } from "next";

// R2のパブリックURLからホスト名を抽出
const getR2Hostname = () => {
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (!r2PublicUrl) return null;
  try {
    const url = new URL(r2PublicUrl);
    return url.hostname;
  } catch {
    return null;
  }
};

const r2Hostname = getR2Hostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // R2のパブリックURLが設定されている場合、そのドメインを許可
      ...(r2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2Hostname,
            },
          ]
        : []),
    ],
    // R2の画像は外部URLのため、必要に応じて最適化を無効化
    // 各Imageコンポーネントでunoptimizedを使用
  },
};

export default nextConfig;
