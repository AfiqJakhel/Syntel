/*
  Warnings:

  - You are about to drop the `_instructionassignees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_instructionassignees` DROP FOREIGN KEY `_InstructionAssignees_A_fkey`;

-- DropForeignKey
ALTER TABLE `_instructionassignees` DROP FOREIGN KEY `_InstructionAssignees_B_fkey`;

-- DropTable
DROP TABLE `_instructionassignees`;

-- CreateTable
CREATE TABLE `instruction_assignees` (
    `instructionId` VARCHAR(191) NOT NULL,
    `staffNip` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`instructionId`, `staffNip`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `instruction_assignees` ADD CONSTRAINT `instruction_assignees_instructionId_fkey` FOREIGN KEY (`instructionId`) REFERENCES `instructions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instruction_assignees` ADD CONSTRAINT `instruction_assignees_staffNip_fkey` FOREIGN KEY (`staffNip`) REFERENCES `users`(`nip`) ON DELETE CASCADE ON UPDATE CASCADE;
