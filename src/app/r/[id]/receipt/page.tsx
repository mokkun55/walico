/* biome-ignore lint: 外部URLの画像表示には通常のimgタグが必要 */
"use client";

import { ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  receipt_image_url: string | null;
}

export default function ReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // ローディング画面
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
        <p className="text-white">読み込み中...</p>
      </div>
    );
  }

  // エラー画面
  if (error || !transaction) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-center">
        <p className="text-lg font-semibold text-white mb-2">エラー</p>
        <p className="text-gray-300 mb-6">
          {error || "トランザクションが見つかりません"}
        </p>
        <Link
          href={`/r/${id}`}
          className="text-emerald-400 hover:text-emerald-300 font-medium"
        >
          戻る
        </Link>
      </div>
    );
  }

  // 画像がない場合
  if (!transaction.receipt_image_url) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {/* Header */}
        <div className="flex items-center justify-between bg-black/80 px-4 py-4 backdrop-blur-sm">
          <Link
            href={`/r/${id}`}
            className="flex items-center gap-2 text-white transition-opacity hover:opacity-80"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>戻る</span>
          </Link>
          <Link
            href={`/r/${id}`}
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        {/* No Image Message */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-white text-lg mb-2">レシート画像がありません</p>
            <p className="text-gray-400 text-sm">
              このトランザクションには画像が添付されていません
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/80 px-4 py-4 backdrop-blur-sm">
        <Link
          href={`/r/${id}`}
          className="flex items-center gap-2 text-white transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>戻る</span>
        </Link>
        <Link
          href={`/r/${id}`}
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            {/** biome-ignore lint/performance/noImgElement: 外部URLの画像表示には通常のimgタグが必要 */}
            <img
              src={transaction.receipt_image_url}
              alt="レシート画像"
              className="h-auto w-full rounded-lg object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
