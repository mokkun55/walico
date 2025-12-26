"use client";

import { ArrowLeft, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

// モックデータ：トランザクション情報
const mockTransaction = {
  id: "sample-id",
  receipt_image_url:
    "https://images.unsplash.com/photo-1623668192707-8f7b86a2c59d?q=80&w=1295&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

export default function ReceiptPage() {
  const params = useParams();
  const id = params.id as string;

  // モック: 実際にはidからトランザクションを取得
  const transaction = mockTransaction;

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
            <Image
              src={transaction.receipt_image_url}
              alt="レシート画像"
              width={1200}
              height={1600}
              className="h-auto w-full rounded-lg object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
