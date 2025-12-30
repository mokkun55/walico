import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/db";
import { transactions, accounts } from "@/libs/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/libs/auth";

export async function GET(
  request: NextRequest,
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

    // ログイン済みユーザーの場合、受信者情報を記録
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (session?.user) {
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

        const lineUserId = userAccount[0]?.accountId;

        // recipient_line_idが未設定の場合のみ更新（最初にアクセスした人を記録）
        if (lineUserId && !transaction.recipientLineId) {
          await db
            .update(transactions)
            .set({
              recipientLineId: lineUserId,
            })
            .where(eq(transactions.id, id));
        }
      }
    } catch (error) {
      // セッション取得に失敗しても続行（ログイン前でも利用可能）
      console.log("Session check failed (user may not be logged in):", error);
    }

    // items_jsonを配列に変換（nullの場合はそのまま）
    const itemsJson =
      transaction.itemsJson !== null ? JSON.parse(transaction.itemsJson) : null;

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
