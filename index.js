const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

let jadwalList = [];
let todoList = [];
let hadirList = [];
const bannedWords = [
  'anjing', 'bangsat', 'bajingan', 'kampret', 'tai', 'sialan', 'brengsek',
  'kontol', 'memek', 'peju', 'titit', 'tetek', 'ngewe', 'coli',
  'gendut', 'jelek', 'tolol', 'idiot', 'goblok', 'bego', 'cacat', 'budek',
  'anak haram', 'anak setan', 'anak babi',
  'cina', 'kafir', 'jamb*t', 'negro',
  'asem', 'keparat', 'jancuk', 'tai kucing', 'tai'
];


client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot WhatsApp sudah aktif!');
});

client.on('message', async (message) => {
    const chat = await message.getChat();
    const isGroup = chat.isGroup;
    const sender = await message.getContact();
    const msg = message.body.toLowerCase();

    // =====================
    // 🧠 Manajemen Grup
    // =====================

    // @all - Mention semua anggota
    if (msg === '@all' && isGroup) {
        let mentions = [];
        for (let p of chat.participants) {
            const contact = await client.getContactById(p.id._serialized);
            mentions.push(contact);
        }
        await chat.sendMessage(`*[Pemberitahuan]*\nMohon perhatian semua anggota 🙏`, { mentions });
    }

    // Anti-Link dan Kick jika bukan admin
    if ((msg.includes('http') || msg.includes('https')) && isGroup) {
        const isAdmin = chat.participants.find(p => p.id._serialized === sender.id._serialized)?.isAdmin;
        if (!isAdmin) {
            await message.delete(true);
            await chat.sendMessage(`⚠️ Link tidak diizinkan!`);
        }
    }

    // Deteksi kata kasar
    for (let kata of bannedWords) {
        if (msg.includes(kata)) {
            await message.delete(true);
            await chat.sendMessage(`⚠️ Hindari penggunaan kata tidak pantas!`);
        }
    }

    // =====================
    // 📅 Penjadwalan
    // =====================

    if (msg.startsWith('!jadwal ')) {
        const input = message.body.split(' ');
        if (input.length >= 4) {
            const tanggal = input[1];
            const jam = input[2];
            const acara = input.slice(3).join(' ');
            const jadwalItem = `📅 *${tanggal}*\n⏰ *${jam}*\n📝 *${acara}*`;
            jadwalList.push(jadwalItem);

            await message.reply(
                `✅ *Jadwal berhasil ditambahkan!*\n\n${jadwalItem}\n\nKetik *!lihatjadwal* untuk melihat semua.`
            );
        } else {
            await message.reply(
                '❗ *Format salah!*\n\nGunakan:\n`!jadwal [tanggal] [jam] [acara]`\n\nContoh:\n`!jadwal 27/06/2025 19:00 Rapat evaluasi`'
            );
        }
    }

    if (msg === '!lihatjadwal') {
        if (jadwalList.length > 0) {
            let list = '*📆 Jadwal Kegiatan Grup:*\n\n';
            jadwalList.forEach((item, i) => {
                list += `*${i + 1}.*\n${item}\n\n`;
            });
            await message.reply(list.trim());
        } else {
            await message.reply(
                '📭 *Belum ada jadwal yang tercatat.*\n\nGunakan:\n`!jadwal [tanggal] [jam] [acara]`\nContoh:\n`!jadwal 28/06/2025 08:00 Briefing pagi`'
            );
        }
    }

    if (msg === '!hapusjadwal') {
        jadwalList = [];
        await message.reply('🗑️ *Semua jadwal telah dihapus.*');
    }

    // =====================
    // ✅ Kehadiran
    // =====================

    if (msg === '!hadir') {
        if (!hadirList.includes(sender.pushname)) {
            hadirList.push(sender.pushname);
            await message.reply(`📌 ${sender.pushname} telah hadir.`);
        } else {
            await message.reply(`👀 Kamu sudah absen.`);
        }
    }

    if (msg === '!daftarhadir') {
        if (hadirList.length === 0) return message.reply('📭 *Belum ada yang hadir hari ini.*');
        await message.reply(`📋 *Daftar Kehadiran:*\n\n${hadirList.map((n, i) => `${i + 1}. ${n}`).join('\n')}`);
    }

    if (msg === '!resetabsen') {
        hadirList = [];
        await message.reply('🧹 *Daftar kehadiran telah direset.*');
    }

    // =====================
    // ✅ To-do List
    // =====================

    if (msg.startsWith('!tambahtodo ')) {
        const tugas = message.body.slice(12);
        todoList.push({ tugas, status: false });
        await message.reply(`📝 *Tugas ditambahkan:*\n${tugas}`);
    }

    if (msg === '!todoku') {
        if (todoList.length === 0) {
            return message.reply('📭 *Belum ada tugas.*');
        }
        let teks = '*📋 Daftar Tugas:*\n\n' + todoList.map((t, i) => `${i + 1}. [${t.status ? '✅' : '❌'}] ${t.tugas}`).join('\n');
        await message.reply(teks);
    }

    if (msg.startsWith('!selesai ')) {
        const nomor = parseInt(message.body.split(' ')[1]) - 1;
        if (todoList[nomor]) {
            todoList[nomor].status = true;
            await message.reply(`✅ *Tugas "${todoList[nomor].tugas}" ditandai selesai.*`);
        } else {
            await message.reply('❗ Nomor tugas tidak ditemukan.');
        }
    }

    // =====================
    // ℹ️ Info & Bantuan
    // =====================

    if (msg === '!info') {
        await message.reply(
            `🤖 *Bot WhatsApp Asisten Grup*\n\n📌 Dibuat oleh: *Its.Rif*\n🎯 Fungsi: Membantu manajemen grup, jadwal, to-do, dan kehadiran.\n\nKetik *!bantu* untuk melihat perintah lengkap.`
        );
    }

    if (msg === '!bantu') {
        await message.reply(`📚 *Menu Bantuan - Asisten Bot Grup*

🧠 *Manajemen Grup*
• @all → Mention semua anggota
• Anti-link & sensor kata kasar

📅 *Penjadwalan*
• !jadwal [tgl] [jam] [acara]
• !lihatjadwal → Lihat jadwal
• !hapusjadwal → Hapus semua

📌 *Kehadiran*
• !hadir
• !daftarhadir
• !resetabsen

📝 *Tugas (To-Do)*
• !tambahtodo [tugas]
• !todoku → Lihat tugas
• !selesai [nomor]

ℹ️ *Lainnya*
• !info → Tentang bot
• !bantu → Menu ini
        `);
    }
});


client.initialize();
