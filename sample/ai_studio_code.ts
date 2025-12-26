// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
  Type,
} from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    temperature: 0,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ["store_name", "date", "items", "total_amount"],
      properties: {
        store_name: {
          type: Type.STRING,
          description: "店舗の名前",
        },
        date: {
          type: Type.STRING,
          description: "購入日（YYYY-MM-DD形式）",
        },
        items: {
          type: Type.ARRAY,
          description: "購入した商品のリスト",
          items: {
            type: Type.OBJECT,
            required: ["name", "price"],
            properties: {
              name: {
                type: Type.STRING,
                description: "商品名",
              },
              price: {
                type: Type.INTEGER,
                description: "商品の単価（円）",
              },
            },
          },
        },
        total_amount: {
          type: Type.INTEGER,
          description: "合計金額",
        },
      },
    },
    systemInstruction: [
        {
          text: `あなたは高精度なレシート読み取りAIです。
ユーザーから送信されたレシート画像をOCR解析し、JSONスキーマに従ってデータを抽出してください。

【ルール】
- 割引（値引き）行がある場合は、割引した値をpriceに含める。
- 小計や消費税の行はitemsに含めない。
- 値が読み取れない場合は null とする。

商品名として抽出する文字列から、以下のノイズを除去して純粋な名称のみにしてください。
- 単価情報（例：「100g当り」「@150」「単価」）
- 重量の記載（例：「(g)」「(円)」）
- 先頭や末尾の不要な記号や数字`,
        }
    ],
  };
  const model = 'gemini-2.0-flash-lite';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
