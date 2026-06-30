CREATE TABLE `animes` (
	`id` integer PRIMARY KEY NOT NULL,
	`anilist_id` integer NOT NULL,
	`title` text NOT NULL,
	`cover_image` text,
	`episodes` integer,
	`genres` text,
	`studio` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `animes_anilist_id_unique` ON `animes` (`anilist_id`);--> statement-breakpoint
CREATE TABLE `criteria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`weight` real NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`anime_id` integer NOT NULL,
	`calculated_score` real NOT NULL,
	`manual_score` real,
	`final_score` real NOT NULL,
	`breakdown` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`anime_id`) REFERENCES `animes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending_upload' NOT NULL,
	`created_at` integer NOT NULL
);
