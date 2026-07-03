ALTER TABLE `criteria_packs` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `scores` ADD `pack_id` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `pack_snapshot` text;