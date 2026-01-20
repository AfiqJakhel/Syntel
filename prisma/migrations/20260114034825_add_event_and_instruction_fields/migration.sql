-- AlterTable
ALTER TABLE `instructions` ADD COLUMN `contentType` VARCHAR(191) NULL,
    ADD COLUMN `thumbnail` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `pic` JSON NOT NULL,
    `platforms` JSON NOT NULL,
    `color` ENUM('GREEN', 'YELLOW', 'RED', 'GRAY') NOT NULL DEFAULT 'GREEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
