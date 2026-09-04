ALTER TABLE `clients` ADD `email` varchar(191);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_email_unique` UNIQUE(`email`);