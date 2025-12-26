import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/db";
import { transactions } from "@/libs/db/schema";
import { lt } from "drizzle-orm";

/**
 * 有効期限切れのトランザクションを削除するCron Job
 * Vercel Cron Jobsから呼び出される
 */
export async function GET(request: NextRequest) {
  try {
    // セキュリティ: Authorization ヘッダーをチェック
    // Vercel Cron Jobsは環境変数 CRON_SECRET を Authorization ヘッダーに設定
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not set");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 現在時刻（Unix timestamp 秒）
    const now = Math.floor(Date.now() / 1000);

    // 削除前の件数を取得（ログ用）
    const expiredTransactions = await db
      .select()
      .from(transactions)
      .where(lt(transactions.expiresAt, now));

    const deletedCount = expiredTransactions.length;

    // 有効期限切れのトランザクションを削除
    if (deletedCount > 0) {
      await db.delete(transactions).where(lt(transactions.expiresAt, now));
    }

    console.log(`[Cron Cleanup] Deleted ${deletedCount} expired transactions`);

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      timestamp: now,
    });
  } catch (error) {
    console.error("Error in cleanup cron job:", error);
    return NextResponse.json(
      { error: "Failed to cleanup expired transactions" },
      { status: 500 }
    );
  }
}
