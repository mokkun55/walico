"use client";

import { Camera, Check, Clock, Keyboard, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TransactionHistory = {
  id: string;
  store_name: string | null;
  request_amount: number;
  status: "pending" | "paid";
  created_at: number;
};

export default function Home() {
  const [hasDraft, setHasDraft] = useState(false);
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const savedIds = JSON.parse(
        localStorage.getItem("walico-transaction-ids") || "[]"
      );

      if (savedIds.length === 0) {
        setHistory([]);
        return;
      }

      // 各トランザクションの情報を取得
      const historyPromises = savedIds.map(async (id: string) => {
        try {
          const response = await fetch(`/api/transactions/${id}`);
          if (!response.ok) {
            // 404や410の場合は履歴から削除
            if (response.status === 404 || response.status === 410) {
              return null;
            }
            throw new Error("Failed to fetch transaction");
          }
          const data = await response.json();
          return {
            id: data.id,
            store_name: data.store_name,
            request_amount: data.request_amount,
            status: data.status,
            created_at: data.created_at,
          };
        } catch (error) {
          console.error(`Error fetching transaction ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(historyPromises);
      const validHistory = results.filter(
        (item): item is TransactionHistory => item !== null
      );

      // 作成日時の降順でソート
      validHistory.sort((a, b) => b.created_at - a.created_at);

      setHistory(validHistory);

      // 無効なIDをlocalStorageから削除
      const validIds = validHistory.map((item) => item.id);
      const updatedIds = savedIds.filter((id: string) =>
        validIds.includes(id)
      );
      localStorage.setItem(
        "walico-transaction-ids",
        JSON.stringify(updatedIds)
      );
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    // LocalStorageから未完了のデータをチェック
    const draft = localStorage.getItem("walico-draft");
    setHasDraft(!!draft);

    // 履歴を読み込む
    loadHistory();
  }, [loadHistory]);

  const handleResume = () => {
    // 前回の続きから再開（将来的に実装）
    // 今は単にinputページに遷移
    window.location.href = "/input?mode=ai&resume=true";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "今日";
    } else if (days === 1) {
      return "昨日";
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pb-40">
      {/* アプリ名 */}
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-gray-800">Walico</h1>
        <p className="mt-1 text-xs text-gray-500">3秒で割り勘。</p>
      </div>

      {/* 履歴セクション */}
      <div className="px-4 pb-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">履歴</h2>
        {isLoadingHistory ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            読み込み中...
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/r/${item.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.status === "paid" ? (
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          item.status === "paid"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {item.status === "paid" ? "完了" : "未完了"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.store_name || "（店名不明）"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-gray-800">
                      ¥{item.request_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            履歴がありません
          </div>
        )}
      </div>

      {/* 前回の続きから再開（未完了データがある場合のみ表示） */}
      {hasDraft && (
        <div className="px-4 pb-4 mb-24">
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
