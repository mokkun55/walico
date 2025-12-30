"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
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

  // AI解析結果の編集可能な値（AIモード用）
  const [editableStoreName, setEditableStoreName] = useState<string>("");
  const [editableTotalAmount, setEditableTotalAmount] = useState<number>(0);
  const [editableItems, setEditableItems] = useState<
    Array<{ name: string; price: number }>
  >([]);

  // URLコピー機能の状態
  const [copied, setCopied] = useState(false);

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

      // 画像をR2にアップロード（AIモードで画像がある場合）
      let receiptImageUrl: string | null = null;
      if (isAIMode && capturedImage) {
        try {
          // Base64画像をBlobに変換
          const response = await fetch(capturedImage);
          const blob = await response.blob();

          // FormDataを作成
          const uploadFormData = new FormData();
          uploadFormData.append("image", blob, "receipt.jpg");

          // R2にアップロード
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(
              errorData.error || "画像のアップロードに失敗しました",
            );
          }

          const uploadData = await uploadResponse.json();
          receiptImageUrl = uploadData.url;
        } catch (error) {
          console.error("Error uploading image:", error);
          // 画像アップロードに失敗してもトランザクション作成は続行
          // ユーザーには警告を表示しない（画像なしでも動作するため）
        }
      }

      // APIに送信するデータを準備（編集可能な値を使用）
      const payload = {
        store_name: isAIMode ? editableStoreName || null : storeName || null,
        total_amount: isAIMode ? editableTotalAmount : totalAmount,
        request_amount: calculatedRequestAmount,
        receipt_image_url: receiptImageUrl,
        items_json:
          editableItems.length > 0
            ? editableItems
                .filter((item) => item.name.trim() !== "" && item.price > 0)
                .map((item) => {
                  // フィルタ後のインデックスで仕分け情報を取得
                  const originalIndex = editableItems.indexOf(item);
                  const assignment = itemAssignments[originalIndex] || "split";
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

      // localStorageにトランザクションIDを保存
      const savedIds = JSON.parse(
        localStorage.getItem("walico-transaction-ids") || "[]",
      );
      if (!savedIds.includes(data.id)) {
        savedIds.push(data.id);
        localStorage.setItem(
          "walico-transaction-ids",
          JSON.stringify(savedIds),
        );
      }

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
        lineMessage,
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
          // 編集可能な値に初期値を設定
          setEditableStoreName(result.store_name || "");
          setEditableTotalAmount(result.total_amount || 0);
          setEditableItems(result.items || []);

          // 解析結果画面に遷移
          router.push("/input?mode=ai&step=result");
        } catch (error) {
          console.error("Error analyzing image:", error);
          setAnalysisError(
            error instanceof Error ? error.message : "解析に失敗しました",
          );
        } finally {
          setIsAnalyzing(false);
        }
      };

      analyzeImage();
    }
  }, [step, capturedImage, isAnalyzing, aiResult, router]);

  // データの取得（編集可能な値を使用）
  // 明細モードが開いている場合は明細から合計を計算、そうでない場合は入力値を使用
  const currentTotalAmount =
    isDetailsOpen && editableItems.length > 0
      ? editableItems.reduce((sum, item) => sum + item.price, 0)
      : isAIMode
        ? editableTotalAmount
        : totalAmount;

  // 割り勘計算
  const requestAmount = Math.round(
    (currentTotalAmount * (100 - splitRatio)) / 100,
  );

  // 明細モードでの計算（簡易版）
  const calculateDetailedAmount = () => {
    if (editableItems.length === 0) return requestAmount;

    let otherAmount = 0;
    editableItems.forEach((item, index) => {
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

  // 商品の編集関数
  const updateItemName = (index: number, name: string) => {
    setEditableItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name };
      return updated;
    });
  };

  const updateItemPrice = (index: number, price: number) => {
    setEditableItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price };
      // 合計金額を自動計算（AIモードの場合のみ自動更新）
      if (isAIMode) {
        const newTotal = updated.reduce((sum, item) => sum + item.price, 0);
        setEditableTotalAmount(newTotal);
      } else {
        // 手入力モードの場合、明細モードが開いているときのみ合計を更新
        if (isDetailsOpen) {
          const newTotal = updated.reduce((sum, item) => sum + item.price, 0);
          setTotalAmount(newTotal);
        }
      }
      return updated;
    });
  };

  const deleteItem = (index: number) => {
    setEditableItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // 合計金額を自動計算（AIモードの場合のみ自動更新）
      if (isAIMode) {
        const newTotal = updated.reduce((sum, item) => sum + item.price, 0);
        setEditableTotalAmount(newTotal);
      } else {
        // 手入力モードの場合、明細モードが開いているときのみ合計を更新
        if (isDetailsOpen) {
          const newTotal = updated.reduce((sum, item) => sum + item.price, 0);
          setTotalAmount(newTotal);
        }
      }
      // 仕分け情報も削除
      const newAssignments = { ...itemAssignments };
      delete newAssignments[index];
      // インデックスを再マッピング
      const remappedAssignments: Record<number, "self" | "other" | "split"> =
        {};
      Object.keys(newAssignments).forEach((key) => {
        const oldIndex = Number(key);
        if (oldIndex > index) {
          remappedAssignments[oldIndex - 1] = newAssignments[oldIndex];
        } else if (oldIndex < index) {
          remappedAssignments[oldIndex] = newAssignments[oldIndex];
        }
      });
      setItemAssignments(remappedAssignments);
      return updated;
    });
  };

  const addItem = () => {
    setEditableItems((prev) => [...prev, { name: "", price: 0 }]);
  };

  // カメラ撮影画面
  if (isAIMode && step === "camera") {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        {/* カメラプレビューエリア */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "environment", // 背面カメラを使用
                aspectRatio: { ideal: 4 / 3 }, // アスペクト比を指定
              }}
              className="w-full h-full object-contain"
            />
          </div>

          {/* ガイドライン */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
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
                type="button"
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

  // URLコピー機能
  const handleCopyUrl = async () => {
    try {
      // localStorageから最新のトランザクションIDを取得
      const savedIds = JSON.parse(
        localStorage.getItem("walico-transaction-ids") || "[]",
      );
      if (savedIds.length === 0) {
        alert("URLが見つかりません");
        return;
      }

      // 最新のIDを使用してURLを構築
      const latestId = savedIds[savedIds.length - 1];
      const transactionUrl = `${window.location.origin}/r/${latestId}`;

      // クリップボードにコピー
      await navigator.clipboard.writeText(transactionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      alert("URLのコピーに失敗しました");
    }
  };

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
        <p className="mb-4 text-emerald-100">LINEアプリが起動しました。</p>
        <p className="mb-8 text-emerald-100 text-sm">
          LINEが開かなかった場合は、下のボタンからURLをコピーできます
        </p>

        {/* ボタンエリア */}
        <div className="w-full max-w-xs space-y-3">
          {/* URLコピーボタン */}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/20 py-3 font-bold text-white transition-colors hover:bg-white/30"
          >
            <Copy className="h-5 w-5" />
            <span>{copied ? "コピーしました！" : "URLをコピー"}</span>
          </button>

          {/* ホームに戻るボタン */}
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
        {/* 店名・合計入力フィールド（AIモードと手入力モード共通） */}
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
              value={isAIMode ? editableStoreName : storeName}
              onChange={(e) => {
                if (isAIMode) {
                  setEditableStoreName(e.target.value);
                } else {
                  setStoreName(e.target.value);
                }
              }}
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
              value={isAIMode ? editableTotalAmount || "" : totalAmount || ""}
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                if (isAIMode) {
                  setEditableTotalAmount(value);
                } else {
                  setTotalAmount(value);
                }
              }}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-2xl font-bold text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

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
                    (currentTotalAmount * splitRatio) / 100,
                  ).toLocaleString()}
                </span>
                <span className="font-semibold text-gray-800">
                  相手: ¥{requestAmount.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 明細モード */}
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

          {isDetailsOpen && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {editableItems.length > 0 ? (
                editableItems.map((item, index) => {
                  const assignment = itemAssignments[index] || "split";
                  return (
                    <div
                      key={`item-${item.name}-${item.price}-${index}`}
                      className="p-3 rounded-xl bg-gray-50 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItemName(index, e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="商品名"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">¥</span>
                            <input
                              type="number"
                              value={item.price || ""}
                              onChange={(e) =>
                                updateItemPrice(
                                  index,
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleItemAssignment(index)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${getAssignmentColor(
                              assignment,
                            )}`}
                          >
                            {getAssignmentLabel(assignment)}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(index)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  明細がありません
                </p>
              )}
              <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">商品を追加</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 確定ボタン（Bottom Fixed） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md">
        <button
          type="button"
          onClick={handleSendLine}
          disabled={
            isSubmitting ||
            (isAIMode ? editableTotalAmount <= 0 : totalAmount <= 0)
          }
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
