import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/db";
import { transactions } from "@/libs/db/schema";
import { randomUUID } from "crypto";

const EXPIRES_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (typeof body.total_amount !== "number" || body.total_amount <= 0) {
      return NextResponse.json(
        { error: "total_amount is required and must be a positive number" },
        { status: 400 }
      );
    }

    if (typeof body.request_amount !== "number" || body.request_amount <= 0) {
      return NextResponse.json(
        { error: "request_amount is required and must be a positive number" },
        { status: 400 }
      );
    }

    // UUID生成
    const id = randomUUID();

    // タイムスタンプ計算
    const now = Math.floor(Date.now() / 1000); // Unix timestamp (秒)
    const expiresAt = now + EXPIRES_DAYS * 24 * 60 * 60; // 7日後

    // items_jsonを文字列に変換（nullの場合はそのまま）
    const itemsJsonString =
      body.items_json && Array.isArray(body.items_json)
        ? JSON.stringify(body.items_json)
        : null;

    // トランザクション作成
    await db.insert(transactions).values({
      id,
      storeName: body.store_name ?? null,
      totalAmount: body.total_amount,
      requestAmount: body.request_amount,
      receiptImageUrl: body.receipt_image_url ?? null,
      itemsJson: itemsJsonString,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    return NextResponse.json({
      id,
      url: `/r/${id}`,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
