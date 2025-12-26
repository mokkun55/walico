import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/db";
import { transactions } from "@/libs/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // トランザクション取得
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = result[0];
    const now = Math.floor(Date.now() / 1000); // Unix timestamp (秒)

    // 有効期限チェック
    if (transaction.expiresAt < now) {
      return NextResponse.json(
        { error: "Transaction has expired" },
        { status: 410 }
      );
    }

    // items_jsonを配列に変換（nullの場合はそのまま）
    const itemsJson =
      transaction.itemsJson !== null
        ? JSON.parse(transaction.itemsJson)
        : null;

    // レスポンス形式に変換
    return NextResponse.json({
      id: transaction.id,
      store_name: transaction.storeName,
      date: new Date(transaction.createdAt * 1000).toISOString().split("T")[0], // ISO 8601形式（日付部分のみ）
      total_amount: transaction.totalAmount,
      request_amount: transaction.requestAmount,
      receipt_image_url: transaction.receiptImageUrl,
      items_json: itemsJson,
      status: transaction.status,
      created_at: transaction.createdAt,
      expires_at: transaction.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

