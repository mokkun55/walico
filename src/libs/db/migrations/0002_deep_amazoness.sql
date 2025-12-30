DROP TABLE `account`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
DROP INDEX `idx_transactions_sender_id`;--> statement-breakpoint
DROP INDEX `idx_transactions_recipient_line_id`;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `sender_id`;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `recipient_line_id`;