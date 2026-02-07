CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`type` text NOT NULL,
	`season` integer,
	`number` integer,
	`category` text,
	`title` text NOT NULL,
	`description` text,
	`keywords` text,
	`stream_url` text NOT NULL,
	`thumbnail_url` text,
	`featured` integer DEFAULT 0,
	`published` integer DEFAULT 1,
	`created_at` integer DEFAULT (strftime('%s','now')),
	`updated_at` integer DEFAULT (strftime('%s','now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_uid_unique` ON `media` (`uid`);--> statement-breakpoint
CREATE TABLE `media_tags` (
	`media_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`media_id`, `tag_id`),
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_id` text NOT NULL,
	`role` text DEFAULT 'user',
	`created_at` integer DEFAULT (strftime('%s','now')),
	`updated_at` integer DEFAULT (strftime('%s','now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);