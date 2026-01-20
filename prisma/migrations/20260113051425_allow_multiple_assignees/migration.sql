/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `instructions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `instructions` DROP FOREIGN KEY `instructions_assigneeId_fkey`;

-- DropIndex
DROP INDEX `instructions_assigneeId_fkey` ON `instructions`;

-- AlterTable
ALTER TABLE `instructions` DROP COLUMN `assigneeId`;

-- CreateTable
CREATE TABLE `_InstructionAssignees` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `_InstructionAssignees_AB_unique`(`A`, `B`),
    INDEX `_InstructionAssignees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_InstructionAssignees` ADD CONSTRAINT `_InstructionAssignees_A_fkey` FOREIGN KEY (`A`) REFERENCES `instructions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_InstructionAssignees` ADD CONSTRAINT `_InstructionAssignees_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`nip`) ON DELETE CASCADE ON UPDATE CASCADE;
