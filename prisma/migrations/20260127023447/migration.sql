/*
  Warnings:

  - The values [GRAY] on the enum `events_color` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `contentType` on the `instructions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(7))`.
  - You are about to alter the column `contentType` on the `submissions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(7))`.

*/
-- AlterTable
ALTER TABLE `events` MODIFY `color` ENUM('GREEN', 'YELLOW', 'RED', 'BLUE') NOT NULL DEFAULT 'GREEN';

-- AlterTable
ALTER TABLE `instructions` MODIFY `contentType` ENUM('INSTAGRAM_POST', 'INSTAGRAM_CAROUSEL', 'INSTAGRAM_REELS', 'INSTAGRAM_STORY', 'TIKTOK_POST', 'YOUTUBE_VIDEO', 'POSTER', 'DOKUMEN_INTERNAL') NULL;

-- AlterTable
ALTER TABLE `submissions` ADD COLUMN `cloudinaryId` VARCHAR(191) NULL,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `fileSize` INTEGER NULL,
    ADD COLUMN `thumbnail` VARCHAR(191) NULL,
    MODIFY `contentType` ENUM('INSTAGRAM_POST', 'INSTAGRAM_CAROUSEL', 'INSTAGRAM_REELS', 'INSTAGRAM_STORY', 'TIKTOK_POST', 'YOUTUBE_VIDEO', 'POSTER', 'DOKUMEN_INTERNAL') NOT NULL;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(20) NOT NULL,
    `type` ENUM('SUBMISSION_NEW', 'SUBMISSION_REVISION', 'INSTRUCTION_URGENT', 'USER_VERIFICATION', 'INSTRUCTION_ASSIGNED', 'SYSTEM') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archive_folders` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `uploaderId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archive_resources` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `duration` INTEGER NULL,
    `cloudinaryId` VARCHAR(191) NULL,
    `contentType` ENUM('INSTAGRAM_POST', 'INSTAGRAM_CAROUSEL', 'INSTAGRAM_REELS', 'INSTAGRAM_STORY', 'TIKTOK_POST', 'YOUTUBE_VIDEO', 'POSTER', 'DOKUMEN_INTERNAL') NULL,
    `uploaderId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`nip`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archive_folders` ADD CONSTRAINT `archive_folders_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archive_folders` ADD CONSTRAINT `archive_folders_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `archive_folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archive_resources` ADD CONSTRAINT `archive_resources_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archive_resources` ADD CONSTRAINT `archive_resources_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `archive_folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
