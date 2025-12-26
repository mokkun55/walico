import { type NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { GoogleGenerativeAIModelId } from "@ai-sdk/google/internal";

// レスポンススキーマ定義
const ReceiptAnalysisSchema = z.object({
  store_name: z.string().nullable().describe("店舗の名前"),
  date: z.string().describe("購入日（YYYY-MM-DD形式）"),
  items: z
    .array(
      z.object({
        name: z.string().describe("商品名"),
        price: z.number().int().describe("商品の単価（円）"),
      })
    )
    .describe("購入した商品のリスト"),
  total_amount: z.number().int().describe("合計金額"),
});

export type ReceiptAnalysis = z.infer<typeof ReceiptAnalysisSchema>;

// 環境変数からモデル名を取得
const MODEL_NAME = process.env.GEMINI_MODEL_NAME as GoogleGenerativeAIModelId;
if (!MODEL_NAME) {
  throw new Error("GEMINI_MODEL_NAME is not set");
}

// システムプロンプト
const SYSTEM_PROMPT = `あなたは高精度なレシート読み取りAIです。
ユーザーから送信されたレシート画像をOCR解析し、JSONスキーマに従ってデータを抽出してください。

【ルール】
- 割引（値引き）行がある場合は、割引した値をpriceに含める。
- 小計や消費税の行はitemsに含めない。
- 値が読み取れない場合は null とする。

商品名として抽出する文字列から、以下のノイズを除去して純粋な名称のみにしてください。
- 単価情報（例：「100g当り」「@150」「単価」）
- 重量の記載（例：「(g)」「(円)」）
- 先頭や末尾の不要な記号や数字`;

export async function POST(request: NextRequest) {
  try {
    // FormDataから画像を取得
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      );
    }

    // 画像をBase64に変換
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    // 画像データURLを作成
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    // APIキーの確認
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEYまたはGOOGLE_GENERATIVE_AI_API_KEYが設定されていません",
        },
        { status: 500 }
      );
    }

    // Google Generative AIプロバイダーを作成
    const googleAI = createGoogleGenerativeAI({ apiKey });

    // Vercel AI SDKを使用してGeminiで解析
    const { object } = await generateObject({
      model: googleAI(MODEL_NAME),
      schema: ReceiptAnalysisSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageDataUrl,
            },
            {
              type: "text",
              text: "このレシート画像から、店名、購入日、商品リスト、合計金額を抽出してください。",
            },
          ],
        },
      ],
      temperature: 0, // 一貫性のため温度を0に設定
    });

    // レスポンスを返す
    return NextResponse.json(object);
  } catch (error) {
    console.error("Error analyzing receipt:", error);

    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "レシートの解析に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
