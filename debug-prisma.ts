
import { prisma } from "./lib/prisma";

async function main() {
    console.log("Prisma keys:", Object.keys(prisma));
    // Check if notification exists
    if ((prisma as any).notification) {
        console.log("prisma.notification exists");
    } else {
        console.log("prisma.notification is UNDEFINED");
        // Check case sensitivity
        if ((prisma as any).Notification) {
            console.log("prisma.Notification exists");
        }
    }
}

main().catch(console.error).finally(() => (prisma as any).$disconnect());
