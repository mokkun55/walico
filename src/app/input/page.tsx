"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

// AI解析結果の型定義
type AIResult = {
  store_name: string | null;
  date: string;
  items: Array<{ name: string; price: number }>;
  total_amount: number;
};

function InputPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "ai";
  const step = searchParams.get("step") || "result";
  const isAIMode = mode === "ai";

  // Webcam関連
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [splitRatio, setSplitRatio] = useState(50); // 50:50
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [itemAssignments, setItemAssignments] = useState<
    Record<number, "self" | "other" | "split">
  >({});

  // 手入力モードの状態管理
  const [storeName, setStoreName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI解析結果の状態管理
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // カメラ撮影処理
  const handleCapture = () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      // ローディング画面に遷移して解析を開始
      router.push("/input?mode=ai&step=loading");
    }
  };

  // 画像ファイル選択処理
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      // ローディング画面に遷移して解析を開始
      router.push("/input?mode=ai&step=loading");
    };
    reader.readAsDataURL(file);
  };

  // ギャラリーから選択ボタンの処理
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  // LINE送信処理
  const handleSendLine = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 計算された請求額
      const calculatedRequestAmount = isDetailsOpen
        ? calculateDetailedAmount()
        : requestAmount;

      // APIに送信するデータを準備
      const payload = {
        store_name: isAIMode ? aiResult?.store_name || null : storeName || null,
        total_amount: isAIMode ? aiResult?.total_amount || 0 : totalAmount,
        request_amount: calculatedRequestAmount,
        receipt_image_url: null, // TODO: Phase 3で実装
        items_json:
          isAIMode && aiResult?.items
            ? aiResult.items.map((item, index) => {
                const assignment = itemAssignments[index] || "split";
                return {
                  name: item.name,
                  price: item.price,
                  assignment, // 仕分け情報も保存（オプション）
                };
              })
            : null,
      };

      // APIを呼び出してトランザクションを作成
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "トランザクションの作成に失敗しました");
      }

      const data = await response.json();
      const transactionUrl = `${window.location.origin}${data.url}`;

      // LINEアプリを起動（URLスキーム）
      const storeNameText = payload.store_name || "店";
      const lineMessage = `ワリコだよ👛
${storeNameText} の分を計算したよ！

今回の金額は
✨ 【 ${calculatedRequestAmount.toLocaleString()} 円 】 ✨ です。

詳しい内訳やレシート画像は、下のリンクから見れるよ👀
支払いが終わったら、リンク先の「完了」ボタンを押してね👇

${transactionUrl}`;
      const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(
        lineMessage
      )}`;

      // LINEアプリを開く
      window.location.href = lineUrl;

      // 送信完了画面に遷移
      router.push("/input?mode=ai&step=complete");
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert(error instanceof Error ? error.message : "エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  // AI解析処理
  useEffect(() => {
    if (step === "loading" && capturedImage && !isAnalyzing && !aiResult) {
      const analyzeImage = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
          // Base64画像をBlobに変換
          const response = await fetch(capturedImage);
          const blob = await response.blob();

          // FormDataを作成
          const formData = new FormData();
          formData.append("image", blob, "receipt.jpg");

          // AI解析APIを呼び出し
          const analyzeResponse = await fetch("/api/analyze", {
            method: "POST",
            body: formData,
          });

          if (!analyzeResponse.ok) {
            const errorData = await analyzeResponse.json();
            throw new Error(errorData.error || "解析に失敗しました");
          }

          const result: AIResult = await analyzeResponse.json();
          setAiResult(result);

          // 解析結果画面に遷移
          router.push("/input?mode=ai&step=result");
        } catch (error) {
          console.error("Error analyzing image:", error);
          setAnalysisError(
            error instanceof Error ? error.message : "解析に失敗しました"
          );
        } finally {
          setIsAnalyzing(false);
        }
      };

      analyzeImage();
    }
  }, [step, capturedImage, isAnalyzing, aiResult, router]);

  // データの取得
  const currentTotalAmount = isAIMode
    ? aiResult?.total_amount || 0
    : totalAmount;

  // 割り勘計算
  const requestAmount = Math.round(
    (currentTotalAmount * (100 - splitRatio)) / 100
  );

  // 明細モードでの計算（簡易版）
  const calculateDetailedAmount = () => {
    if (!isAIMode || !aiResult) return requestAmount;

    let otherAmount = 0;
    aiResult.items.forEach((item, index) => {
      const assignment = itemAssignments[index] || "split";
      if (assignment === "other") {
        otherAmount += item.price;
      } else if (assignment === "split") {
        // 明細モード時は常に50:50で計算
        otherAmount += Math.round(item.price * 50) / 100;
      }
    });
    return otherAmount;
  };

  const finalRequestAmount = isDetailsOpen
    ? calculateDetailedAmount()
    : requestAmount;

  const toggleItemAssignment = (index: number) => {
    setItemAssignments((prev) => {
      const current = prev[index] || "split";
      const next =
        current === "self" ? "other" : current === "other" ? "split" : "self";
      return { ...prev, [index]: next };
    });
  };

  const getAssignmentLabel = (assignment: "self" | "other" | "split") => {
    switch (assignment) {
      case "self":
        return "自分";
      case "other":
        return "相手";
      case "split":
        return "割り勘";
    }
  };

  const getAssignmentColor = (assignment: "self" | "other" | "split") => {
    switch (assignment) {
      case "self":
        return "bg-emerald-50 text-emerald-700";
      case "other":
        return "bg-rose-50 text-rose-700";
      case "split":
        return "bg-gray-100 text-gray-700";
    }
  };

  // カメラ撮影画面
  if (isAIMode && step === "camera") {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        {/* カメラプレビューエリア */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 relative overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment", // 背面カメラを使用
            }}
            className="w-full h-full object-cover"
          />

          {/* ガイドライン */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] aspect-3/4 border-2 border-white/50 rounded-2xl" />
          </div>
        </div>

        {/* コントロールエリア */}
        <div className="bg-black px-6 py-8 pb-safe">
          <div className="flex items-center justify-center gap-6">
            {/* ギャラリーから選択 */}
            <button
              type="button"
              onClick={handleGalleryClick}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ImageIcon className="h-6 w-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* 撮影ボタン */}
            <button
              type="button"
              onClick={handleCapture}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg transition-all active:scale-95"
            >
              <div className="h-16 w-16 rounded-full border-4 border-emerald-500 bg-white" />
            </button>

            {/* キャンセル */}
            <Link
              href="/"
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AI解析中ローディング画面
  if (isAIMode && step === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-emerald-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AI解析中...</h2>
          <p className="text-gray-500 text-sm">レシートを読み取っています</p>
          {analysisError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{analysisError}</p>
              <button
                onClick={() => router.push("/input?mode=ai&step=camera")}
                className="mt-2 text-red-600 text-sm underline"
              >
                もう一度試す
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 送信完了画面
  if (step === "complete") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-emerald-500 p-6 text-center text-white">
        {/* チェックマークアイコン */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white animate-bounce">
          <Check className="h-10 w-10 text-emerald-500" />
        </div>

        {/* タイトル */}
        <h2 className="mb-2 text-3xl font-bold">送信完了！</h2>

        {/* 説明文 */}
        <p className="mb-8 text-emerald-100">LINEアプリが起動しました。</p>

        {/* ホームに戻るボタン */}
        <div className="w-full max-w-xs">
          <Link
            href="/"
            className="block w-full py-3 text-emerald-100 font-bold text-sm transition-colors hover:text-white"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  // 解析結果画面（既存の画面）
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center px-4 pt-12 pb-6">
        <Link
          href="/"
          className="mr-4 flex items-center gap-1 text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>戻る</span>
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">
          {isAIMode ? "レシート解析結果" : "手入力"}
        </h1>
      </header>

      <div className="flex-1 px-4 pb-32">
        {/* 店名・合計表示 */}
        {isAIMode && aiResult && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-gray-500">店名</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">
              {aiResult.store_name || "（店名不明）"}
            </p>
            <p className="mt-4 text-sm text-gray-500">合計金額</p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">
              ¥{aiResult.total_amount.toLocaleString()}
            </p>
          </div>
        )}

        {/* 手入力モード：入力フィールド */}
        {!isAIMode && (
          <div className="mb-6 space-y-4">
            <div>
              <label
                htmlFor="store-name"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                店名（任意）
              </label>
              <input
                id="store-name"
                type="text"
                placeholder="例: サンディ"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label
                htmlFor="total-amount"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                合計金額
              </label>
              <input
                id="total-amount"
                type="number"
                placeholder="0"
                value={totalAmount || ""}
                onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-2xl font-bold text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}

        {/* 割り勘スライダー */}
        <div
          className={`mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 ${
            isDetailsOpen ? "opacity-60" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">自分</span>
            <span
              className={`text-lg font-bold ${
                isDetailsOpen ? "text-gray-500" : "text-emerald-500"
              }`}
            >
              {isDetailsOpen ? "50%" : `${splitRatio}%`}
            </span>
            <span className="text-sm font-medium text-gray-800">相手</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={isDetailsOpen ? 50 : splitRatio}
            onChange={(e) => {
              if (isDetailsOpen) return; // 明細モード時は無効
              const value = Number(e.target.value);
              // 10%刻みに丸める（念のため）
              const rounded = Math.round(value / 10) * 10;
              setSplitRatio(rounded);
            }}
            disabled={isDetailsOpen}
            className={`w-full h-3 bg-gray-200 rounded-lg appearance-none accent-emerald-500 ${
              isDetailsOpen ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            style={{
              background: isDetailsOpen
                ? `linear-gradient(to right, #10B981 0%, #10B981 50%, #E5E7EB 50%, #E5E7EB 100%)`
                : `linear-gradient(to right, #10B981 0%, #10B981 ${splitRatio}%, #E5E7EB ${splitRatio}%, #E5E7EB 100%)`,
            }}
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            {isDetailsOpen ? (
              <>
                <span className="text-gray-400">
                  自分: ¥
                  {Math.round((currentTotalAmount * 50) / 100).toLocaleString()}
                </span>
                <span className="text-gray-400">
                  相手: ¥
                  {Math.round((currentTotalAmount * 50) / 100).toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-500">
                  自分: ¥
                  {Math.round(
                    (currentTotalAmount * splitRatio) / 100
                  ).toLocaleString()}
                </span>
                <span className="font-semibold text-gray-800">
                  相手: ¥{requestAmount.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 明細モード（AIモード時のみ） */}
        {isAIMode && (
          <div className="mb-6 rounded-2xl bg-white border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">
                明細を個別に仕分け
              </span>
              {isDetailsOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {isDetailsOpen && aiResult && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                {aiResult.items.map((item, index) => {
                  const assignment = itemAssignments[index] || "split";
                  return (
                    <div
                      key={`${item.name}-${item.price}-${index}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ¥{item.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleItemAssignment(index)}
                        className={`ml-3 px-3 py-1.5 rounded-xl text-xs font-medium ${getAssignmentColor(
                          assignment
                        )}`}
                      >
                        {getAssignmentLabel(assignment)}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 確定ボタン（Bottom Fixed） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md">
        <button
          type="button"
          onClick={handleSendLine}
          disabled={isSubmitting || (!isAIMode && totalAmount <= 0)}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-3xl bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600 active:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-lg font-semibold">送信中...</span>
            </>
          ) : (
            <span className="text-lg font-semibold">
              LINE で送る（¥{finalRequestAmount.toLocaleString()}）
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function InputPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      }
    >
      <InputPageContent />
    </Suspense>
  );
}
