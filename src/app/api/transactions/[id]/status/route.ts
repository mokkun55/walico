import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/db";
import { transactions } from "@/libs/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    if (body.status !== "paid") {
      return NextResponse.json(
        { error: "status must be 'paid'" },
        { status: 400 }
      );
    }

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

    // 既に支払い済みかチェック
    if (transaction.status === "paid") {
      return NextResponse.json(
        { error: "Transaction is already paid" },
        { status: 400 }
      );
    }

    // ステータスを更新
    await db
      .update(transactions)
      .set({ status: "paid" })
      .where(eq(transactions.id, id));

    return NextResponse.json({
      id: transaction.id,
      status: "paid",
    });
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      { error: "Failed to update transaction status" },
      { status: 500 }
    );
  }
}

