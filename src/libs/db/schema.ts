import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(), // UUID
    storeName: text("store_name"),
    totalAmount: integer("total_amount").notNull(),
    requestAmount: integer("request_amount").notNull(),
    receiptImageUrl: text("receipt_image_url"),
    itemsJson: text("items_json"), // JSON文字列として保存
    status: text("status", { enum: ["pending", "paid"] })
      .notNull()
      .default("pending"),
    createdAt: integer("created_at").notNull(), // Unix timestamp (秒)
    expiresAt: integer("expires_at").notNull(), // Unix timestamp (秒)
  },
  (t) => [
    index("idx_transactions_created_at").on(t.createdAt),
    index("idx_transactions_expires_at").on(t.expiresAt),
  ]
);

// 型エクスポート
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
