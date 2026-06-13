const { Telegraf } = require('telegraf');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const express = require('express');
const cors = require('cors');

// 1. Kredensial Firebase
const serviceAccount = {
  "type": "service_account",
  "project_id": "lsairdrop",
  "private_key_id": "4bc80e1beabfc8e76c87895855c8bf246110ad08",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCg2wnqvBhsBwEb\nsbgWb8+SEdYPoXP19M++KTFZQUtfHOtgFNgW7HZco4u6uow3fPGjZiGth5kaBuAw\ntAAk3i9r6o0Nx644etW7VDKR5yaBVHP5cm8+n8MuxCkea3Y6ljGy9A/mN0YXKENs\ns2vpuDG2F4xBr4xZEFwKRZQmqG9KNH9DjP9ZJW28IZvw1pePbZYhnsqNdQHz7zJ0\nO7clqyLSQXphb0B7jbW4kpEx3tZ531+C3yEfef+ASdzggda7W6fU2kadLunpdfPZ\nTMUtKY1lpaySqS6rw3zfQHYUza8LoJrCY+/Y13rnYCalGZU/SBfmRS8v+UDy8xVi\n6qm6p5RFAgMBAAECggEAFLaoFANlNLIBNUcBINiElvd3hHtCsrsz7jWhPnBfS4/u\nimicu/T2t+6yfVjs2e9bsXIjJ5SkxTp576OaOiUnX6LsR4g9WdYNhEovGeU1auWM\naqSPCTYq/PBzKBDoAFrbawMtMfTPsIc1iX+gR5A5zIxDOikoLkbiR0tW7NR3QkuE\niOQqQsC5CRe4Xw98GbfcGsQjthFXec/S+jxtn4PdrIwKDMNRkvtyVHkTBITXHHq2\n503KUvjZ/UnGgmVuqoqmIFHN/g5d+fQS57BEy9Gx8y2jg5hj1mmOfE1tHh2ZWnki\n5m7wJrzIGpjBHuttJiBCWHC6s7IXGUCQAlF7ZJ8C8QKBgQDQX0gVRSFAkuxMspKt\nz2ASaMYeAOoWGcla+N0v+rCW+gbGs++IvLTeXX+k0uQEYx+AuFZ6x+qLZRSX1cQK\nlYqMyvsZ6oYHlF6QpxQaD0QF2aow6oRHocw8dX4djYKgvMBwl+GR7s0HqL9pOzhB\nHzHR8GcagIEZNhXeAyY+4pf3lQKBgQDFn12zWYkpVjtilozsWGDhBPiKgeipN8YJ\naRxbkFdyho4O2KlF946BOTk8a7l74FHSCPLYx787QVprnVWatA+HYQZVoYCTg4Y3\n/AA3ayS+8u1dNYdBo4WjFIeVNCXAx1WEcmRB4T7w8GoxJE6D8Dy5GpubKvt8pB0p\nNiYOuvU98QKBgQCixbuueekm417Z7ykrw3I+D0CsUXSLPSuQ+BT5FPD7j2bZs9fr\nTdZQWmOK4v8h+jiyuc08bozmxVhX37IbvoOTxkBvF0gKBbn1b78BOGmf1E/hlGEu\n/9JmbDXPairf23LMwaiA8jWRxR15W7xvCqpFYHF6P2YZxqlAW991glbKHQKBgAEy\ndvHYMAGFGTT+rnncCzIxwoOsR8mGofd6oIZZeH4kHIYwf84BsuZLf3JDQMtkT3qT\nPU1c4Gaufaq7OEKIprNuPgiUwt+h41VBfIrZZk6V0CRJZ7lZET0sqamYuEXTr0vv\nGXZgs+3ntuz3SFZ6RRPl+l1VRFK798VBI7fhIA0xAoGACRuI0GOqYKhW/3Z0qkaT6\nc7hUAEHIhLcyMPZxRoD/ZCOjTnnn1c7UuC/JOfLYaxwBTYLTxqxRW4mxwcoitLb\nrPE8hXp2A2cGfythsmnyEh0RpjiUL1fK/6t+BYs0k1+R3Pd0Tm6pzdiua1F1xYA9\nTlboUzhkV6l/f0ybjBjePG0=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@lsairdrop.iam.gserviceaccount.com"
};

initializeApp({ 
    credential: cert(serviceAccount)
});

// Menghubungkan ke nama database kustom kamu yaitu "default"
const db = getFirestore("default");

const bot = new Telegraf('8572906179:AAFUanJAlYUBJBG_o6PYezP9YWEfZaeD2HQ');

function generateRandomKey(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'LS-';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 2. Logika Utama Pengiriman Key (Dibungkus dalam fungsi agar bisa dipakai 2 kali)
const sendKeyLogic = async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || "Unknown";

    try {
        // Cek dulu apakah ID Telegram ini sudah punya key di database
        const existingKeys = await db.collection("access_keys")
            .where("generated_by", "==", userId)
            .limit(1)
            .get();

        // Jika sudah pernah bikin, berikan key yang sama (tidak expired bagi dia)
        if (!existingKeys.empty) {
            const oldKey = existingKeys.docs[0].id;
            return ctx.reply(`Anda sudah memiliki key aktif! Berikut adalah key Anda:\n\n\`${oldKey}\`\n\nSilakan masukkan key tersebut di website.`, { parse_mode: 'Markdown' });
        }

        // Jika benar-benar user baru, buatkan key baru
        const newKey = generateRandomKey();
        await db.collection("access_keys").doc(newKey).set({
            key: newKey, 
            generated_by: userId, 
            username: username,
            is_used: false, 
            device_id: null, // Masih kosong sebelum dimasukkan ke web
            created_at: FieldValue.serverTimestamp() 
        });

        ctx.reply(`Sukses! Berikut adalah key unik Anda:\n\n\`${newKey}\`\n\nSilakan masukkan key tersebut di website.`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.log("\n=========================================");
        console.error("🚨 ADA ERROR SAAT MENYIMPAN KE FIREBASE 🚨");
        console.error(error);
        console.log("=========================================\n");
        ctx.reply("Maaf, terjadi kesalahan saat membuat key.");
    }
};

// Pasang fungsi di atas untuk command /getkey DAN tombol /start
bot.command('getkey', sendKeyLogic);
bot.start(sendKeyLogic); 

bot.launch();
console.log("✅ Bot Telegram berhasil berjalan...");

const app = express();
app.use(cors({ origin: true })); 
app.use(express.json());

// 3. API Verifikasi Key (Mengunci Perangkat Browser)
app.post('/verifyKey', async (req, res) => {
    const { key, deviceId } = req.body; 
    
    if (!key) return res.status(400).json({ success: false, message: "Key tidak boleh kosong!" });
    if (!deviceId) return res.status(400).json({ success: false, message: "Perangkat tidak dikenali!" });

    try {
        const keyRef = db.collection("access_keys").doc(key);
        const doc = await keyRef.get();

        if (!doc.exists) return res.status(404).json({ success: false, message: "Key tidak valid." });
        
        const keyData = doc.data();

        // JIKA KEY SUDAH PERNAH DIGUNAKAN SEBELUMNYA
        if (keyData.is_used === true) {
            // Cek apakah deviceId pengakses sama dengan deviceId yang mengunci key ini pertama kali
            if (keyData.device_id === deviceId) {
                // Jika device sama, loloskan!
                return res.status(200).json({ success: true, message: "Akses Diberikan (Perangkat Terverifikasi)!" });
            } else {
                // Jika dibuka di browser/HP lain, blokir!
                return res.status(401).json({ success: false, message: "Key ini sudah terkunci di perangkat lain!" });
            }
        }

        // JIKA KEY BARU PERTAMA KALI DIGUNAKAN
        // Kunci key ini ke deviceId pengakses pertama kali
        await keyRef.update({
            is_used: true,
            device_id: deviceId, 
            used_at: FieldValue.serverTimestamp()
        });

        return res.status(200).json({ success: true, message: "Akses Pertama Diberikan!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
    }
});

app.listen(3000, () => {
    console.log(`✅ Server API berjalan di http://localhost:3000`);
});