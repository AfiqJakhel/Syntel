
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const notifications = await prisma.notification.findMany();
    console.log("Notifications in DB:", JSON.stringify(notifications, null, 2));

    const users = await prisma.user.findMany({
        where: { role: 'OFFICER' }
    });
    console.log("Officer Users in DB:", JSON.stringify(users.map(u => ({ nip: u.nip, firstName: u.firstName })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
