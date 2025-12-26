CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`store_name` text,
	`total_amount` integer NOT NULL,
	`request_amount` integer NOT NULL,
	`receipt_image_url` text,
	`items_json` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_created_at` ON `transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_transactions_expires_at` ON `transactions` (`expires_at`);