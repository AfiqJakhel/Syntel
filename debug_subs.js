const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    console.log('--- DEBUG SUBMISSIONS ---');
    const subs = await prisma.submission.findMany({
        include: {
            author: {
                select: { nip: true, firstName: true, lastName: true }
            }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    subs.forEach(s => {
        console.log(`ID: ${s.id} | Title: ${s.title} | authorId: ${s.authorId} | Author: ${s.author.firstName} ${s.author.lastName} (${s.author.nip})`);
    });

    console.log('\n--- DEBUG USERS ---');
    const users = await prisma.user.findMany({
        select: { nip: true, firstName: true, lastName: true }
    });
    users.forEach(u => console.log(`${u.nip}: ${u.firstName} ${u.lastName}`));

    await prisma.$disconnect();
}

debug();
