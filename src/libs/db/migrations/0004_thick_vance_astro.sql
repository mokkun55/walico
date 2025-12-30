ALTER TABLE `transactions` ADD `sender_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `recipient_line_id` text;--> statement-breakpoint
CREATE INDEX `idx_transactions_sender_id` ON `transactions` (`sender_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_recipient_line_id` ON `transactions` (`recipient_line_id`);