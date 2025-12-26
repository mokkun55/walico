"use client";

import { Camera, Keyboard, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    // LocalStorageから未完了のデータをチェック
    const draft = localStorage.getItem("walico-draft");
    setHasDraft(!!draft);
  }, []);

  const handleResume = () => {
    // 前回の続きから再開（将来的に実装）
    // 今は単にinputページに遷移
    window.location.href = "/input?mode=ai&resume=true";
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Center: Branding */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-40">
        <h1 className="text-5xl font-bold text-gray-800">Walico</h1>
        <p className="mt-3 text-base text-gray-500">3秒で割り勘。</p>
      </div>

      {/* 前回の続きから再開（未完了データがある場合のみ表示） */}
      {hasDraft && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleResume}
            className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" />
              <span>前回の続きから再開</span>
            </div>
          </button>
        </div>
      )}

      {/* Action Area (Bottom Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 shadow-lg">
        {/* Primary: レシート撮影 */}
        <Link
          href="/input?mode=ai&step=camera"
          className="flex h-20 w-full items-center justify-center gap-3 rounded-3xl bg-emerald-500 text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl active:bg-emerald-600 active:scale-[0.98]"
        >
          <Camera className="h-8 w-8" />
          <span className="text-xl font-bold">レシート撮影</span>
        </Link>

        {/* Secondary: 手入力 */}
        <Link
          href="/input?mode=manual"
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 text-gray-500 transition-colors hover:text-gray-800"
        >
          <Keyboard className="h-5 w-5" />
          <span className="text-base font-medium">手入力</span>
        </Link>
      </div>
    </div>
  );
}
