import { auth } from "@/libs/auth";
import { db } from "@/libs/db";
import { transactions, accounts } from "@/libs/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

    // ユーザーのLINEアカウント情報を取得
    const userAccount = await db
      .select({
        accountId: accounts.accountId,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, session.user.id),
          eq(accounts.providerId, "line")
        )
      )
      .limit(1);

    const lineUserId = userAccount[0]?.accountId || null;

    // 送った請求の集計
    const sentPending = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.requestAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.senderId, session.user.id),
          eq(transactions.status, "pending")
        )
      );

    const sentPaid = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.requestAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.senderId, session.user.id),
          eq(transactions.status, "paid")
        )
      );

    // 受け取った請求の集計
    let receivedPending = { total: 0 };
    let receivedPaid = { total: 0 };

    if (lineUserId) {
      receivedPending = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.requestAmount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.recipientLineId, lineUserId),
            eq(transactions.status, "pending")
          )
        )
        .then((result) => result[0] || { total: 0 });

      receivedPaid = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.requestAmount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.recipientLineId, lineUserId),
            eq(transactions.status, "paid")
          )
        )
        .then((result) => result[0] || { total: 0 });
    }

    return NextResponse.json({
      sent: {
        pending: Number(sentPending[0]?.total || 0),
        paid: Number(sentPaid[0]?.total || 0),
      },
      received: {
        pending: Number(receivedPending.total || 0),
        paid: Number(receivedPaid.total || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { error: "サマリーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

