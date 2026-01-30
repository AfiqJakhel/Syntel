
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // 1. Find user Ani Wijaya to get her ID
    const ani = await prisma.user.findFirst({
        where: {
            firstName: "Ani",
            lastName: "Wijaya"
        }
    });

    if (!ani) {
        console.log("User Ani Wijaya not found");
        return;
    }
    console.log(`User: ${ani.firstName} ${ani.lastName} (${ani.nip})`);

    // 2. Find submission "I KNOWW"
    // Search loosely in case of case sensitivity or spacing
    const submission = await prisma.submission.findFirst({
        where: {
            title: {
                contains: "I KNOWW" // removed case insensitive mode if not supported by sqlite/mysql widely without configuration, but Prisma usually supports it.
                // kept it simple first.
            }
        },
        include: {
            instruction: {
                include: {
                    assignees: true
                }
            },
            author: true
        }
    });

    if (!submission) {
        console.log("Submission 'I KNOWW' not found.");
        return;
    }

    console.log("--- Submission Found ---");
    console.log(`ID: ${submission.id}`);
    console.log(`Title: ${submission.title}`);
    console.log(`Author: ${submission.author.firstName} ${submission.author.lastName}`);
    console.log(`Instruction ID: ${submission.instructionId}`);

    if (submission.instruction) {
        console.log(`Instruction Title: ${submission.instruction.title}`);
        console.log("--- Assignees ---");
        submission.instruction.assignees.forEach((a: any) => {
            const isAni = a.staffNip === ani.nip;
            console.log(`- ${a.staffNip} ${isAni ? "(THIS IS ANI)" : ""}`);
        });

        const isAniAssigned = submission.instruction.assignees.some((a: any) => a.staffNip === ani.nip);
        if (isAniAssigned) {
            console.log("\nCONCLUSION: Ani is assigned to this instruction.");
            console.log(`Ani should look for instruction title: "${submission.instruction.title}" in her list, NOT "${submission.title}"`);
        } else {
            console.log("\nCONCLUSION: Ani is NOT assigned. This shouldn't appear in her feed if filters work.");
        }

    } else {
        console.log("This is an INITIATIVE (No Instruction).");
        if (submission.authorId !== ani.nip) {
            console.log("CONCLUSION: This is another user's initiative. Should NOT appear in Ani's feed.");
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
