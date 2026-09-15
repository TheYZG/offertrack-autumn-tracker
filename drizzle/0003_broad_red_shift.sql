CREATE TABLE `assessment_interview_links` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`company` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_assessment_links_owner_updated` ON `assessment_interview_links` (`owner_user_id`,`updated_at`);