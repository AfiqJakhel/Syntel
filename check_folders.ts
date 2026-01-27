import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const folders = await prisma.archiveFolder.findMany()
    console.log(JSON.stringify(folders, null, 2))
}

main().catch(console.error)
