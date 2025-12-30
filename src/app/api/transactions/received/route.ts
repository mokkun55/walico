import { auth } from "@/libs/auth";
import { db } from "@/libs/db";
import { transactions, users, accounts } from "@/libs/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
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

    // recipient_line_idでトランザクションを検索
    // ログイン済みユーザー同士の場合は、将来的にrecipient_idでも検索可能にする
    let receivedTransactions: Array<{
      id: string;
      storeName: string | null;
      requestAmount: number;
      status: "pending" | "paid";
      createdAt: number;
      senderId: string | null;
    }> = [];

    if (lineUserId) {
      receivedTransactions = await db
        .select({
          id: transactions.id,
          storeName: transactions.storeName,
          requestAmount: transactions.requestAmount,
          status: transactions.status,
          createdAt: transactions.createdAt,
          senderId: transactions.senderId,
        })
        .from(transactions)
        .where(eq(transactions.recipientLineId, lineUserId))
        .orderBy(desc(transactions.createdAt));
    }

    // 送信者情報を取得
    const senderIds = receivedTransactions
      .map((tx) => tx.senderId)
      .filter((id): id is string => id !== null);

    const senderMap = new Map();
    if (senderIds.length > 0) {
      const senderUsers = await db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
        })
        .from(users)
        .where(
          or(...senderIds.map((id) => eq(users.id, id)))
        );

      senderUsers.forEach((user) => {
        senderMap.set(user.id, {
          id: user.id,
          display_name: user.name,
          avatar_url: user.image,
        });
      });
    }

    // 合計金額を計算
    let totalPending = 0;
    let totalPaid = 0;

    const transactionList = receivedTransactions.map((tx) => {
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
        sender: tx.senderId ? senderMap.get(tx.senderId) || null : null,
      };
    });

    return NextResponse.json({
      transactions: transactionList,
      total_pending: totalPending,
      total_paid: totalPaid,
    });
  } catch (error) {
    console.error("Error fetching received transactions:", error);
    return NextResponse.json(
      { error: "受け取った請求一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

