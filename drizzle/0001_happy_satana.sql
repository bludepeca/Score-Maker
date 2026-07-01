CREATE TABLE `criteria_items` (
	`id` text PRIMARY KEY NOT NULL,
	`pack_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`weight` real NOT NULL,
	`score_explanations` text,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pack_id`) REFERENCES `criteria_packs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `criteria_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false
);
