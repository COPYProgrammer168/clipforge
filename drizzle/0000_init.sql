CREATE TABLE IF NOT EXISTS `clip` (
	`id` text PRIMARY KEY NOT NULL,
	`jobId` text NOT NULL,
	`userId` text NOT NULL,
	`clipIndex` integer NOT NULL,
	`title` text NOT NULL,
	`startSeconds` integer NOT NULL,
	`endSeconds` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`aspectRatio` text NOT NULL,
	`captionStyle` text NOT NULL,
	`blobUrl` text NOT NULL,
	`thumbnailUrl` text,
	`srtUrl` text,
	`captionText` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `clip_job_idx` ON `clip` (`jobId`,`clipIndex`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `job` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`videoId` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`stage` text DEFAULT 'queued' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`error` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`workerId` text,
	`lockedAt` integer,
	`options` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`videoId`) REFERENCES `video`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_status_idx` ON `job` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_user_idx` ON `job` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `usage_event` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`jobId` text,
	`secondsProcessed` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `usage_user_idx` ON `usage_event` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`plan` text DEFAULT 'free' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `video` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`sourceType` text NOT NULL,
	`sourceUrl` text,
	`blobUrl` text,
	`durationSeconds` integer,
	`sizeBytes` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `video_user_idx` ON `video` (`userId`);