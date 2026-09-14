CREATE TABLE `editing_usage` (
	`user_id` text NOT NULL,
	`usage_date` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `usage_date`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
