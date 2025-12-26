import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Cloudflare R2設定
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// S3クライアントの初期化（R2はS3互換API）
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      return NextResponse.json(
        { error: "R2設定が不完全です。環境変数を確認してください。" },
        { status: 500 }
      );
    }

    // FormDataから画像を取得
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "サポートされていない画像形式です。JPEG、PNG、WebPのみ対応しています。" },
        { status: 400 }
      );
    }

    // ファイルサイズの検証（10MB制限）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "画像サイズが大きすぎます。10MB以下にしてください。" },
        { status: 400 }
      );
    }

    // 一意のファイル名を生成
    const fileExtension = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${fileExtension}`;
    const key = `receipts/${fileName}`;

    // 画像をバッファに変換
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // R2にアップロード
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: imageFile.type,
      // パブリック読み取りを許可（R2のパブリックURL設定に依存）
    });

    await s3Client.send(command);

    // パブリックURLを生成（完全なURLであることを保証）
    const baseUrl = R2_PUBLIC_URL.endsWith("/")
      ? R2_PUBLIC_URL.slice(0, -1)
      : R2_PUBLIC_URL;
    const publicUrl = `${baseUrl}/${key}`;

    // URLが完全なURL（https://で始まる）であることを確認
    if (!publicUrl.startsWith("http://") && !publicUrl.startsWith("https://")) {
      throw new Error("R2_PUBLIC_URL must be a complete URL starting with http:// or https://");
    }

    return NextResponse.json({
      url: publicUrl,
      key: key,
    });
  } catch (error) {
    console.error("Error uploading image to R2:", error);
    return NextResponse.json(
      {
        error: "画像のアップロードに失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

