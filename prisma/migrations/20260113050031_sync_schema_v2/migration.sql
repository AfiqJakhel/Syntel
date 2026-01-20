-- AlterTable
ALTER TABLE `users` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` ENUM('STAFF', 'OFFICER') NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE `instructions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `deadline` DATETIME(3) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `issuerId` VARCHAR(191) NOT NULL,
    `assigneeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'REVISION', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `feedback` TEXT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `instructionId` VARCHAR(191) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `submissions_instructionId_key`(`instructionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `instructions` ADD CONSTRAINT `instructions_issuerId_fkey` FOREIGN KEY (`issuerId`) REFERENCES `users`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructions` ADD CONSTRAINT `instructions_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_instructionId_fkey` FOREIGN KEY (`instructionId`) REFERENCES `instructions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`nip`) ON DELETE SET NULL ON UPDATE CASCADE;
