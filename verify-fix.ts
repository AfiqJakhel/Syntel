
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const submission = await prisma.submission.findFirst({
        where: {
            instructionId: { not: null }
        },
        select: {
            authorId: true,
            id: true,
            instructionId: true,
            title: true
        }
    });

    if (!submission) {
        console.log("No instruction-based submission found.");
        return;
    }

    console.log(`Testing with authorId: ${submission.authorId}`);
    console.log(`Expected Activity ID for "${submission.title}": ${submission.instructionId}`);

    const res = await fetch(`http://localhost:3000/api/staff/stats?authorId=${submission.authorId}`);
    const data = await res.json();

    const activity = data.activities.find((a: any) => a.detail === submission.title);

    if (activity) {
        console.log(`Actual Activity ID: ${activity.id}`);
        if (activity.id === submission.instructionId) {
            console.log("✅ VERIFICATION SUCCESSFUL");
        } else {
            console.log("❌ VERIFICATION FAILED");
        }
    } else {
        console.log("Activity not found in recent activities.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
