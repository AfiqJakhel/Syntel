import { PrismaClient, EventColor } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({});

async function main() {
    console.log("🌱 Mulai seeding database...");

    // Data dummy pegawai
    const dummyUsers = [
        {
            nip: "198501012010",
            firstName: "Ahmad",
            lastName: "Susanto",
            username: "ahmad.susanto",
            email: "ahmad.susanto@telkom.co.id",
            phone: "081234567801",
            password: "password123",
        },
        {
            nip: "199203152015",
            firstName: "Siti",
            lastName: "Nurhaliza",
            username: "siti.nurhaliza",
            email: "siti.nurhaliza@telkom.co.id",
            phone: "081234567802",
            password: "password123",
        },
        {
            nip: "198812202012",
            firstName: "Budi",
            lastName: "Santoso",
            username: "budi.santoso",
            email: "budi.santoso@telkom.co.id",
            phone: "081234567803",
            password: "password123",
        },
        {
            nip: "199505102018",
            firstName: "Dewi",
            lastName: "Lestari",
            username: "dewi.lestari",
            email: "dewi.lestari@telkom.co.id",
            phone: "081234567804",
            password: "password123",
        },
        {
            nip: "199010252013",
            firstName: "Rudi",
            lastName: "Hermawan",
            username: "rudi.hermawan",
            email: "rudi.hermawan@telkom.co.id",
            phone: "081234567805",
            password: "password123",
        },
        {
            nip: "198707182011",
            firstName: "Ani",
            lastName: "Wijaya",
            username: "ani.wijaya",
            email: "ani.wijaya@telkom.co.id",
            phone: "081234567806",
            password: "password123",
        },
        {
            nip: "199408122017",
            firstName: "Hendra",
            lastName: "Gunawan",
            username: "hendra.gunawan",
            email: "hendra.gunawan@telkom.co.id",
            phone: "081234567807",
            password: "password123",
        },
        {
            nip: "199112052014",
            firstName: "Maya",
            lastName: "Sari",
            username: "maya.sari",
            email: "maya.sari@telkom.co.id",
            phone: "081234567808",
            password: "password123",
        },
        {
            nip: "198903302012",
            firstName: "Eko",
            lastName: "Prasetyo",
            username: "eko.prasetyo",
            email: "eko.prasetyo@telkom.co.id",
            phone: "081234567809",
            password: "password123",
        },
        {
            nip: "199606172019",
            firstName: "Rina",
            lastName: "Kusuma",
            username: "rina.kusuma",
            email: "rina.kusuma@telkom.co.id",
            phone: "081234567810",
            password: "password123",
        },
    ];

    // Hash semua password dan insert data
    for (const user of dummyUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { nip: user.nip },
            update: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: dummyUsers.indexOf(user) === 0 ? "OFFICER" : "STAFF",
                isVerified: true,
                termsAccepted: true,
            },
            create: {
                nip: user.nip,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                password: hashedPassword,
                role: dummyUsers.indexOf(user) === 0 ? "OFFICER" : "STAFF",
                isVerified: true,
                termsAccepted: true,
            },
        });

        console.log(`✅ User ${user.firstName} ${user.lastName} (NIP: ${user.nip}) berhasil ditambahkan`);
    }

    // Data dummy pegawai yang belum diverifikasi
    const unverifiedUsers = [
        {
            nip: "231522911",
            firstName: "Afiq",
            lastName: "Jaelani",
            username: "AfiqJaelani",
            email: "example123@gmail.com",
            phone: "081234567811",
            password: "password123",
        },
        {
            nip: "199801012020",
            firstName: "Andi",
            lastName: "Wijaya",
            username: "andi.wijaya",
            email: "andi.wijaya@telkom.co.id",
            phone: "081234567812",
            password: "password123",
        },
        {
            nip: "199902022021",
            firstName: "Putri",
            lastName: "Maharani",
            username: "putri.maharani",
            email: "putri.maharani@telkom.co.id",
            phone: "081234567813",
            password: "password123",
        },
        {
            nip: "200003032022",
            firstName: "Rizki",
            lastName: "Firmansyah",
            username: "rizki.firmansyah",
            email: "rizki.firmansyah@telkom.co.id",
            phone: "081234567814",
            password: "password123",
        },
        {
            nip: "200104042023",
            firstName: "Sinta",
            lastName: "Dewi",
            username: "sinta.dewi",
            email: "sinta.dewi@telkom.co.id",
            phone: "081234567815",
            password: "password123",
        },
        {
            nip: "199705052019",
            firstName: "Dimas",
            lastName: "Pratama",
            username: "dimas.pratama",
            email: "dimas.pratama@telkom.co.id",
            phone: "081234567816",
            password: "password123",
        },
        {
            nip: "199806062020",
            firstName: "Lina",
            lastName: "Marlina",
            username: "lina.marlina",
            email: "lina.marlina@telkom.co.id",
            phone: "081234567817",
            password: "password123",
        },
        {
            nip: "199907072021",
            firstName: "Fajar",
            lastName: "Nugroho",
            username: "fajar.nugroho",
            email: "fajar.nugroho@telkom.co.id",
            phone: "081234567818",
            password: "password123",
        },
        {
            nip: "200008082022",
            firstName: "Indah",
            lastName: "Permata",
            username: "indah.permata",
            email: "indah.permata@telkom.co.id",
            phone: "081234567819",
            password: "password123",
        },
        {
            nip: "200109092023",
            firstName: "Arif",
            lastName: "Rahman",
            username: "arif.rahman",
            email: "arif.rahman@telkom.co.id",
            phone: "081234567820",
            password: "password123",
        },
        {
            nip: "199710102019",
            firstName: "Nurul",
            lastName: "Hidayah",
            username: "nurul.hidayah",
            email: "nurul.hidayah@telkom.co.id",
            phone: "081234567821",
            password: "password123",
        },
        {
            nip: "199811112020",
            firstName: "Bayu",
            lastName: "Setiawan",
            username: "bayu.setiawan",
            email: "bayu.setiawan@telkom.co.id",
            phone: "081234567822",
            password: "password123",
        },
        {
            nip: "199912122021",
            firstName: "Ratna",
            lastName: "Sari",
            username: "ratna.sari",
            email: "ratna.sari@telkom.co.id",
            phone: "081234567823",
            password: "password123",
        },
        {
            nip: "200001012022",
            firstName: "Yoga",
            lastName: "Aditya",
            username: "yoga.aditya",
            email: "yoga.aditya@telkom.co.id",
            phone: "081234567824",
            password: "password123",
        },
        {
            nip: "200102022023",
            firstName: "Fitri",
            lastName: "Handayani",
            username: "fitri.handayani",
            email: "fitri.handayani@telkom.co.id",
            phone: "081234567825",
            password: "password123",
        },
    ];

    // Hash dan insert data user yang belum diverifikasi
    for (const user of unverifiedUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { nip: user.nip },
            update: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: "STAFF",
                isVerified: false,
                termsAccepted: true,
            },
            create: {
                nip: user.nip,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                password: hashedPassword,
                role: "STAFF",
                isVerified: false,
                termsAccepted: true,
            },
        });

        console.log(`✅ User belum verifikasi ${user.firstName} ${user.lastName} (NIP: ${user.nip}) berhasil ditambahkan`);
    }

    // Cleanup existing data to avoid unique constraint errors
    console.log("🧹 Membersihkan data lama...");
    await (prisma as any).submission.deleteMany({});
    await (prisma as any).instruction.deleteMany({});
    await (prisma as any).notification.deleteMany({});
    await (prisma as any).event.deleteMany({});

    // Seed Instructions (Officer Ahmad assigns to Staff)
    const officerAhmad = dummyUsers[0].nip;
    const staffMembers = dummyUsers.slice(1, 4).map(u => u.nip); // Siti, Budi, Dewi

    console.log("📝 Menambahkan data instruksi...");

    // Instruction 1: Multiple Assignees (Siti & Budi)
    const inst1 = await prisma.instruction.create({
        data: {
            id: "INS-01",
            title: "Kampanye Promo Awal Tahun 2026",
            description: "Buat carousel Instagram untuk promo paket data awal tahun.",
            deadline: new Date("2026-02-01"),
            priority: "HIGH",
            issuerId: officerAhmad,
            assignees: {
                create: [
                    { staff: { connect: { nip: staffMembers[0] } } },
                    { staff: { connect: { nip: staffMembers[1] } } }
                ]
            }
        }
    });

    // Instruction 2: Single Assignee (Budi) - This one will have submission
    const inst2 = await prisma.instruction.create({
        data: {
            id: "INS-02",
            title: "Video Reels Behind The Scene",
            description: "Dokumentasikan suasana kantor untuk konten TikTok/Reels.",
            deadline: new Date("2026-01-25"),
            priority: "MEDIUM",
            issuerId: officerAhmad,
            assignees: {
                create: [
                    { staff: { connect: { nip: staffMembers[1] } } }
                ]
            }
        }
    });

    // Instruction 3: Single Assignee (Dewi)
    await prisma.instruction.create({
        data: {
            id: "INS-03",
            title: "Infografis Kinerja Q4 2025",
            description: "Visualisasikan pencapaian tim selama kuartal terakhir.",
            deadline: new Date("2026-01-30"),
            priority: "LOW",
            issuerId: officerAhmad,
            assignees: {
                create: [
                    { staff: { connect: { nip: staffMembers[2] } } }
                ]
            }
        }
    });

    // Seed Submissions (Mixing Instructions and Initiatives)
    console.log("📤 Menambahkan data submission massal...");

    const contentTypes = [
        "INSTAGRAM_REELS",
        "INSTAGRAM_CAROUSEL",
        "INSTAGRAM_STORY",
        "YOUTUBE_VIDEO",
        "TIKTOK_POST",
        "INSTAGRAM_POST",
        "POSTER",
        "DOKUMEN_INTERNAL"
    ];

    const statuses = ["PENDING", "REVISION", "APPROVED"];
    const submissions = [];

    // 1. Tambahkan 80 data APPROVED agar data di Pie Chart terlihat padat
    for (let i = 1; i <= 80; i++) {
        const randomDate = new Date();
        // Variasi hari (0-60 hari lalu), jam, dan menit
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 60));
        randomDate.setHours(Math.floor(Math.random() * 24));
        randomDate.setMinutes(Math.floor(Math.random() * 60));

        submissions.push({
            id: `SBM-${i.toString().padStart(2, '0')}`,
            title: `Konten Produk ${i}`,
            contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
            status: "APPROVED",
            authorId: staffMembers[i % staffMembers.length],
            createdAt: randomDate
        });
    }

    // 2. Tambahkan 50 data Campuran (PENDING & REVISION)
    // Berikan beberapa yang sangat baru agar terlihat "Satu Menit Yang Lalu" dsb.
    for (let i = 1; i <= 50; i++) {
        const randomDate = new Date();

        if (i <= 5) {
            // 5 data terbaru dalam hitungan menit/jam terakhir
            randomDate.setMinutes(randomDate.getMinutes() - (i * 10)); // 10, 20, 30... menit lalu
        } else {
            // Sisanya variasi hari (0-10 hari lalu)
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 10));
            randomDate.setHours(Math.floor(Math.random() * 24));
            randomDate.setMinutes(Math.floor(Math.random() * 60));
        }

        const mixedStatus = i % 2 === 0 ? "PENDING" : "REVISION";
        const subIdNum = 80 + i;

        submissions.push({
            id: `SBM-${subIdNum.toString().padStart(2, '0')}`,
            title: `Tugas Operasional ${i}`,
            contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
            status: mixedStatus,
            authorId: staffMembers[i % staffMembers.length],
            createdAt: randomDate
        });
    }

    for (const sub of submissions) {
        await prisma.submission.create({
            data: {
                id: sub.id,
                title: sub.title,
                contentType: sub.contentType as any,
                status: sub.status as any,
                authorId: sub.authorId,
                createdAt: sub.createdAt
            }
        });
    }

    console.log(`✅ Berhasil menambahkan ${submissions.length} data submission.`);

    // 3. Tambahkan 30 Instruksi khusus untuk pengerjaan intensif dengan format ID standar
    console.log("📝 Menambahkan 30 instruksi dummy dengan format ID standar...");
    for (let i = 1; i <= 30; i++) {
        const deadlineDate = new Date();
        // Deadline acak antara 1 sampai 7 hari ke depan dengan variasi jam
        deadlineDate.setDate(deadlineDate.getDate() + Math.floor(Math.random() * 7) + 1);
        deadlineDate.setHours(Math.floor(Math.random() * 24));
        deadlineDate.setMinutes(Math.floor(Math.random() * 60));

        const nextIdNumber = i + 10; // Melanjutkan dari 10 instruksi pertama
        const instructionId = `INS-${nextIdNumber.toString().padStart(2, '0')}`;

        // Tentukan jumlah pengampu (beberapa instruksi punya tim besar 3-5 orang)
        let assigneesToCreate = [];
        if (i <= 10) {
            // Instruksi 1-10 punya tim 3-5 orang secara acak
            const teamSize = Math.floor(Math.random() * 3) + 3; // 3, 4, atau 5
            const shuffledStaff = [...staffMembers].sort(() => 0.5 - Math.random());
            const selectedStaff = shuffledStaff.slice(0, teamSize);
            assigneesToCreate = selectedStaff.map(nip => ({ staff: { connect: { nip } } }));
        } else {
            // Sisanya tetap 1 orang saja
            assigneesToCreate = [{ staff: { connect: { nip: staffMembers[i % staffMembers.length] } } }];
        }

        const instruction = await prisma.instruction.create({
            data: {
                id: instructionId,
                title: i <= 10 ? `Kolaborasi Tim Strategis ${i}` : `Tugas Prioritas ${i}`,
                description: i <= 10
                    ? `Proyek kerja sama tim untuk tugas nomor ${i}. Membutuhkan koordinasi antar anggota.`
                    : `Pengerjaan mendesak untuk tugas nomor ${i} yang harus segera diselesaikan.`,
                deadline: deadlineDate,
                priority: i <= 10 ? "HIGH" : (i % 2 === 0 ? "MEDIUM" : "LOW"),
                issuerId: officerAhmad,
                assignees: {
                    create: assigneesToCreate
                }
            }
        });

        // Sekitar 12 dari 30 instruksi sudah ada submission awal atau revisi
        if (i <= 12) {
            const urgentSubIdNum = 80 + 50 + i;
            await prisma.submission.create({
                data: {
                    id: `SBM-${urgentSubIdNum.toString().padStart(2, '0')}`,
                    title: `Draft Konten Tugas ${i}`,
                    contentType: contentTypes[i % contentTypes.length],
                    status: i % 3 === 0 ? "REVISION" : "PENDING",
                    authorId: staffMembers[i % staffMembers.length],
                    instructionId: instruction.id,
                    createdAt: new Date()
                }
            });
        }
    }

    console.log("📅 Menambahkan data event massal...");

    await prisma.event.deleteMany({}); // Clean existing events

    const eventColors: EventColor[] = ["GREEN", "YELLOW", "RED", "BLUE"];
    const eventTitles = [
        "Workshop Digital Marketing", "Campaign Promo IndiHome", "Launching Paket IndiBiz",
        "Meeting Koordinasi Tim Creative", "Evaluasi Bulanan Q1", "Brainstorming Konten Ramadan",
        "Penyerahan Reward Staff Terbaik", "Webinar Cyber Security", "Training Content Creator",
        "Shooting Video Company Profile", "Photoshoot Produk Baru", "Campaign Telkom Anniversary",
        "Briefing Operasional Mingguan", "Workshop Fotografi Produk", "Sesi Review Konten Sosmed"
    ];

    const allUserNips = dummyUsers.map(u => u.nip);

    for (let i = 1; i <= 45; i++) {
        const randomDate = new Date("2026-01-01");
        randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 120)); // Diverse dates across 4 months

        const randomPics = [];
        const picCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 PICs
        for (let j = 0; j < picCount; j++) {
            randomPics.push(allUserNips[Math.floor(Math.random() * allUserNips.length)]);
        }

        await prisma.event.create({
            data: {
                id: `EVT-${i.toString().padStart(4, '0')}`,
                title: `${eventTitles[i % eventTitles.length]} - Batch ${i}`,
                description: `Deskripsi untuk event dummy ke-${i}. Fokus pada peningkatan performa dan kolaborasi tim.`,
                date: randomDate,
                location: "Gedung Telkom Witel Jakarta Centrum / Zoom Meeting",
                pic: randomPics,
                color: eventColors[Math.floor(Math.random() * eventColors.length)]
            }
        });
    }

    console.log(`✅ Berhasil menambahkan 45 data event.`);

    console.log("🔔 Menambahkan data notifikasi...");
    const ahmadNip = "198501012010"; // Ahmad Susanto (Officer)
    const sitiNip = "199203152015";  // Siti Nurhaliza (Staff)
    const budiNip = "198812202012";  // Budi Santoso (Staff)

    const notificationData = [
        // Notifications for Ahmad (Officer)
        { userId: ahmadNip, type: "SUBMISSION_NEW", title: "Pengajuan Baru", message: "Budi Santoso baru saja mengunggah pengajuan untuk 'Kampanye Promo Awal Tahun 2026'.", link: "/dashboard/officer/instruksi?view=TRACKING" },
        { userId: ahmadNip, type: "INSTRUCTION_URGENT", title: "Tenggat Waktu Mendekat", message: "Tenggat waktu 'Proyek Strategis' dalam 3 jam lagi.", link: "/dashboard/officer/instruksi?view=TRACKING" },
        { userId: ahmadNip, type: "USER_VERIFICATION", title: "Verifikasi User", message: "Ada 15 user baru yang menunggu verifikasi akun.", link: "/dashboard/officer/verification" },

        // Notifications for Siti (Staff)
        { userId: sitiNip, type: "INSTRUCTION_ASSIGNED", title: "Tugas Baru", message: "Anda telah ditugaskan untuk instruksi baru: 'Video Reels Behind The Scene'.", link: "/dashboard/staff" },
        { userId: sitiNip, type: "SYSTEM", title: "Pengajuan Disetujui", message: "Selamat! Pengajuan 'Konten Produk 01' telah disetujui oleh Officer.", link: "/dashboard/staff" },

        // Notifications for Budi (Staff)
        { userId: budiNip, type: "SUBMISSION_REVISION", title: "Revisi Diperlukan", message: "Pengajuan 'Tugas Operasional 01' memerlukan perbaikan.", link: "/dashboard/staff" },
        { userId: budiNip, type: "SYSTEM", title: "Pengajuan Disetujui", message: "Selamat! Pengajuan 'Konten Produk 05' telah disetujui.", link: "/dashboard/staff" }
    ];

    let ntfCounter = 1;
    for (const notif of notificationData) {
        await (prisma as any).notification.create({
            data: {
                id: `NTF-${ntfCounter.toString().padStart(2, '0')}`,
                userId: notif.userId,
                type: notif.type as any,
                title: notif.title,
                message: notif.message,
                link: notif.link,
                createdAt: new Date(Date.now() - (ntfCounter * 3600000))
            }
        });
        ntfCounter++;
    }

    console.log("🎉 Seeding selesai!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
