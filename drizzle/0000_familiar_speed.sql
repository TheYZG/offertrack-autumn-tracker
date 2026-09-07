CREATE TABLE `application_records` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`portal_url` text DEFAULT '' NOT NULL,
	`applied_at` text DEFAULT '' NOT NULL,
	`deadline_at` text DEFAULT '' NOT NULL,
	`source_status` text,
	`stage` text NOT NULL,
	`stage_category` text NOT NULL,
	`stage_status` text NOT NULL,
	`next_action` text DEFAULT '' NOT NULL,
	`priority` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_application_records_updated_at` ON `application_records` (`updated_at`);