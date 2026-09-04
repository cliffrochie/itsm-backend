CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`middle_name` varchar(100),
	`last_name` varchar(100) NOT NULL,
	`extension_name` varchar(50),
	`contact_no` varchar(50),
	`avatar` varchar(255),
	`role` enum('admin','service_engineer','staff','user') NOT NULL DEFAULT 'user',
	`is_active` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`code` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offices_id` PRIMARY KEY(`id`),
	CONSTRAINT `offices_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `designations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`middle_name` varchar(100),
	`last_name` varchar(100) NOT NULL,
	`extension_name` varchar(50),
	`contact_no` varchar(50),
	`office_id` bigint unsigned,
	`designation_id` bigint unsigned,
	`user_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_tickets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`ticket_no` varchar(50) NOT NULL,
	`task_type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`nature_of_work` text,
	`serial_no` varchar(100),
	`equipment_type` varchar(100),
	`equipment_type_others` varchar(255),
	`defects_found` text,
	`service_rendered` text,
	`service_status` enum('open','in_progress','resolved','closed','cancelled') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'low',
	`remarks` text,
	`admin_remarks` text,
	`rating` tinyint unsigned,
	`rating_comment` text,
	`client_id` bigint unsigned,
	`service_engineer_id` bigint unsigned,
	`created_by_id` bigint unsigned,
	`updated_by_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_tickets_ticket_no_unique` UNIQUE(`ticket_no`)
);
--> statement-breakpoint
CREATE TABLE `service_ticket_histories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`service_ticket_id` bigint unsigned NOT NULL,
	`performed_by_id` bigint unsigned,
	`action` varchar(100) NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_ticket_histories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_counters` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`year` smallint unsigned NOT NULL,
	`month` tinyint unsigned NOT NULL,
	`last_count` int unsigned NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_counters_id` PRIMARY KEY(`id`),
	CONSTRAINT `year_month_idx` UNIQUE(`year`,`month`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`ticket_id` bigint unsigned,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `action_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entity_id` varchar(100),
	`details` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_office_id_offices_id_fk` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_designation_id_designations_id_fk` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_tickets` ADD CONSTRAINT `service_tickets_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_tickets` ADD CONSTRAINT `service_tickets_service_engineer_id_users_id_fk` FOREIGN KEY (`service_engineer_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_tickets` ADD CONSTRAINT `service_tickets_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_tickets` ADD CONSTRAINT `service_tickets_updated_by_id_users_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_ticket_histories` ADD CONSTRAINT `service_ticket_histories_service_ticket_id_service_tickets_id_fk` FOREIGN KEY (`service_ticket_id`) REFERENCES `service_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_ticket_histories` ADD CONSTRAINT `service_ticket_histories_performed_by_id_users_id_fk` FOREIGN KEY (`performed_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ticket_id_service_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `service_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `action_logs` ADD CONSTRAINT `action_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;