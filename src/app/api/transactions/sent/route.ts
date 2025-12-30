import { auth } from "@/libs/auth";
import { db } from "@/libs/db";
import { transactions } from "@/libs/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // セッションを確認
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // sender_idでトランザクションを検索
    const userTransactions = await db
      .select({
        id: transactions.id,
        storeName: transactions.storeName,
        requestAmount: transactions.requestAmount,
        status: transactions.status,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.senderId, session.user.id))
      .orderBy(desc(transactions.createdAt));

    // 合計金額を計算
    let totalPending = 0;
    let totalPaid = 0;

    const transactionList = userTransactions.map((tx) => {
      if (tx.status === "pending") {
        totalPending += tx.requestAmount;
      } else {
        totalPaid += tx.requestAmount;
      }

      return {
        id: tx.id,
        store_name: tx.storeName,
        request_amount: tx.requestAmount,
        status: tx.status,
        created_at: tx.createdAt,
      };
    });

    return NextResponse.json({
      transactions: transactionList,
      total_pending: totalPending,
      total_paid: totalPaid,
    });
  } catch (error) {
    console.error("Error fetching sent transactions:", error);
    return NextResponse.json(
      { error: "送った請求一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

