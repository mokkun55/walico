"use client";

import { ArrowRight, Check, Loader2, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  store_name: string | null;
  date: string;
  total_amount: number;
  request_amount: number;
  receipt_image_url: string | null;
  items_json: Array<{ name: string; price: number }> | null;
  status: "pending" | "paid";
  created_at: number;
  expires_at: number;
}

export default function ReceiverPage() {
  const params = useParams();
  const id = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // トランザクションを取得
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/transactions/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("トランザクションが見つかりません");
          } else if (response.status === 410) {
            setError("トランザクションの有効期限が切れています");
          } else {
            setError("トランザクションの取得に失敗しました");
          }
          return;
        }

        const data = await response.json();
        setTransaction(data);
        setIsPaid(data.status === "paid");
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError("エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const handlePay = async () => {
    if (isUpdating || isPaid) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/transactions/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "paid" }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const error = await response.json();
          throw new Error(
            error.error || "既に支払い済みか、無効なリクエストです"
          );
        } else if (response.status === 404) {
          throw new Error("トランザクションが見つかりません");
        } else if (response.status === 410) {
          throw new Error("トランザクションの有効期限が切れています");
        } else {
          throw new Error("支払い完了の更新に失敗しました");
        }
      }

      const data = await response.json();
      
      // トランザクション状態を更新
      if (transaction) {
        setTransaction({ ...transaction, status: "paid" });
      }
      setIsPaid(true);
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsUpdating(false);
    }
  };

  // 有効期限までの日数を計算
  const getDaysUntilExpiry = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = expiresAt - now;
    const days = Math.floor(diff / (24 * 60 * 60));
    return days > 0 ? days : 0;
  };

  // 負担率を計算
  const calculateRatio = (total: number, request: number) => {
    if (total === 0) return 0;
    return Math.round((request / total) * 100);
  };

  // ローディング画面
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // エラー画面
  if (error || !transaction) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-lg font-semibold text-gray-800 mb-2">エラー</p>
        <p className="text-gray-500">{error || "トランザクションが見つかりません"}</p>
        <Link
          href="/"
          className="mt-6 text-emerald-500 hover:text-emerald-600 font-medium"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Hero Section */}
      <div className="relative z-10 overflow-hidden rounded-b-[2.5rem] bg-white pb-8 pt-12 text-center shadow-sm">
        <div className="absolute left-0 top-0 h-2 w-full bg-emerald-500" />
        <p className="mb-2 text-sm font-bold text-gray-400">
          {transaction.store_name || "店名なし"}
        </p>
        <p className="mb-6 text-xs text-gray-300">{transaction.date}</p>

        <div className="mb-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
            お支払い金額
          </span>
        </div>
        <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-gray-800">
          <span className="mr-1 align-top text-2xl">¥</span>
          {transaction.request_amount.toLocaleString()}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {/* Receipt Image Button */}
        <Link
          href={`/r/${id}/receipt`}
          className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-emerald-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-500">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-700">レシート画像</p>
              <p className="text-xs text-gray-400">
                有効期限: あと{getDaysUntilExpiry(transaction.expires_at)}日
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-emerald-500" />
        </Link>

        {/* Breakdown */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-800">計算の内訳</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">会計合計</span>
              <span className="font-medium">
                ¥{transaction.total_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">負担率</span>
              <span className="font-medium">
                {calculateRatio(transaction.total_amount, transaction.request_amount)}% (あなた)
              </span>
            </div>
            <div className="my-2 h-px bg-gray-100" />
            <div className="flex justify-between font-bold text-emerald-600">
              <span>請求額</span>
              <span>¥{transaction.request_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-gray-100 bg-white p-4">
        {!isPaid ? (
          <button
            type="button"
            onClick={handlePay}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>処理中...</span>
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                支払いを完了する
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-gray-100 py-4 text-lg font-bold text-gray-400"
          >
            <Check className="h-5 w-5" />
            支払い済み
          </button>
        )}
      </div>
    </div>
  );
}
