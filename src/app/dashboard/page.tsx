"use client";

import { authClient } from "@/libs/auth-client";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Settings,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  store_name: string | null;
  request_amount: number;
  status: "pending" | "paid";
  created_at: number;
  sender?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type Summary = {
  sent: {
    pending: number;
    paid: number;
  };
  received: {
    pending: number;
    paid: number;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [sentTransactions, setSentTransactions] = useState<Transaction[]>([]);
  const [receivedTransactions, setReceivedTransactions] = useState<
    Transaction[]
  >([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // セッションを確認
        const { data: session } = await authClient.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }

        setUserImage(session.user.image || null);
        setUserName(session.user.name || "");

        // データを並列で取得
        const [sentRes, receivedRes, summaryRes] = await Promise.all([
          fetch("/api/transactions/sent"),
          fetch("/api/transactions/received"),
          fetch("/api/dashboard/summary"),
        ]);

        if (!sentRes.ok || !receivedRes.ok || !summaryRes.ok) {
          throw new Error("データの取得に失敗しました");
        }

        const sentData = await sentRes.json();
        const receivedData = await receivedRes.json();
        const summaryData = await summaryRes.json();

        setSentTransactions(sentData.transactions || []);
        setReceivedTransactions(receivedData.transactions || []);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                ダッシュボード
              </h1>
              {userName && <p className="text-xs text-gray-500">{userName}</p>}
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-6 w-6 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* サマリーセクション */}
      {summary && (
        <div className="px-4 py-6 space-y-4 shrink-0">
          {/* 送った請求 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-800">
                送った請求
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">未完了</span>
                  <span className="text-lg font-bold text-amber-600">
                    ¥{summary.sent.pending.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">完了</span>
                  <span className="text-lg font-bold text-emerald-600">
                    ¥{summary.sent.paid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 受け取った請求 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">
                受け取った請求
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 ">
                  <span className="text-sm text-gray-500">未払い</span>
                  <span className="text-lg font-bold text-amber-600">
                    ¥{summary.received.pending.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">支払済み</span>
                  <span className="text-lg font-bold text-emerald-600">
                    ¥{summary.received.paid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "sent"
                ? "bg-emerald-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            送った請求
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "received"
                ? "bg-emerald-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            受け取った請求
          </button>
        </div>
      </div>

      {/* トランザクション一覧 */}
      <div className="flex-1 px-4 pb-6 space-y-2 overflow-y-auto min-h-0">
        {activeTab === "sent" ? (
          sentTransactions.length > 0 ? (
            sentTransactions.map((tx) => (
              <Link
                key={tx.id}
                href={`/r/${tx.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {tx.status === "paid" ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          tx.status === "paid"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {tx.status === "paid" ? "完了" : "未完了"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {tx.store_name || "（店名不明）"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-gray-800">
                      ¥{tx.request_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              送った請求がありません
            </div>
          )
        ) : receivedTransactions.length > 0 ? (
          receivedTransactions.map((tx) => (
            <Link
              key={tx.id}
              href={`/r/${tx.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {tx.status === "paid" ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        tx.status === "paid"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {tx.status === "paid" ? "支払済み" : "未払い"}
                    </span>
                  </div>
                  {tx.sender && (
                    <p className="text-xs text-gray-500 mb-1">
                      {tx.sender.display_name || "送信者"} から
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {tx.store_name || "（店名不明）"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-lg font-bold text-gray-800">
                    ¥{tx.request_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            受け取った請求がありません
          </div>
        )}
      </div>
    </div>
  );
}
