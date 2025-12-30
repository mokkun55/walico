"use client";

import { authClient } from "@/libs/auth-client";
import { LogOut, Save, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }
        setUserName(session.user.name || "");
        setUserImage(session.user.image || null);
      } catch (error) {
        console.error("Error loading user data:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleSaveName = async () => {
    if (!userName.trim()) {
      setError("ユーザー名を入力してください");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/user/update-name", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: userName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "ユーザー名の更新に失敗しました");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // セッションを再取得してユーザー名を更新
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setUserName(session.user.name || "");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      setError(
        error instanceof Error
          ? error.message
          : "ユーザー名の更新に失敗しました"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
        },
      });
    } catch (error) {
      console.error("Error logging out:", error);
      setError("ログアウトに失敗しました");
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            {/** biome-ignore lint/a11y/noSvgWithoutTitle: svg icon */}
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">設定</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* プロフィールセクション */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            {userImage ? (
              <img
                src={userImage}
                alt="プロフィール"
                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">
                プロフィール
              </h2>
              <p className="text-sm text-gray-500">LINEアカウントから取得</p>
            </div>
          </div>

          {/* ユーザー名変更 */}
          <div className="space-y-2">
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gray-700"
            >
              ユーザー名
            </label>
            <div className="flex gap-2">
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="ユーザー名を入力"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-white font-medium transition-colors hover:bg-emerald-600 active:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>保存</span>
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-600">
                ユーザー名を更新しました
              </p>
            )}
          </div>
        </div>

        {/* ログアウト */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-50 px-6 py-4 text-red-600 font-medium transition-colors hover:bg-red-100 active:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                <span>ログアウト中...</span>
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
