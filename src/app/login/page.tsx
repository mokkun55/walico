"use client";

import { authClient } from "@/libs/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // リダイレクト先を取得（クエリパラメータから、またはデフォルトで/dashboard）
  const callbackURL = searchParams.get("callback") || "/dashboard";

  const handleLineLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({
        provider: "line",
        callbackURL,
      });
    } catch (err) {
      console.error("Login error:", err);
      setError("ログインに失敗しました。もう一度お試しください。");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Walico</h1>
          <p className="mt-2 text-sm text-gray-500">ログインして請求を管理</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ログインボタン */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#06C755] px-6 py-4 text-white shadow-lg transition-all hover:bg-[#05B048] active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="text-base font-semibold">ログイン中...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.348 0 .629.285.629.63 0 .349-.281.63-.629.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.046 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span className="text-base font-semibold">LINEでログイン</span>
              </>
            )}
          </button>

          {/* 説明 */}
          <p className="text-center text-xs text-gray-500">
            LINEアカウントでログインすると、請求履歴を管理できます
          </p>

          {/* プライバシーポリシーへの同意 */}
          <p className="text-center text-xs text-gray-500">
            ログインすることで、
            <Link
              href="/privacy"
              className="text-emerald-600 hover:text-emerald-700 underline"
              target="_blank"
            >
              プライバシーポリシー
            </Link>
            に同意したものとみなされます。
          </p>
        </div>

        {/* ホームに戻る */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
