/**
 * Script buat generate banyak QR code sekaligus.
 * Setiap QR isinya link: https://qrseno.com/setup/<id>
 *
 * Cara pakai:
 *   npm install qrcode
 *   node generate-qrcodes.js
 *
 * Hasilnya: folder "qrcodes" berisi file qr-1.png, qr-2.png, dst,
 * plus file daftar-qrcode.csv buat catatan/tracking.
 */

const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// ---------- UBAH BAGIAN INI SESUAI KEBUTUHAN ----------
const DOMAIN = "https://qrseno.com"; // ganti ke domainmu (atau alamat hosting kamu)
const START_ID = 1;                   // mulai dari ID berapa
const TOTAL = 100;                    // mau bikin berapa banyak QR
const OUTPUT_DIR = "qrcodes";
// --------------------------------------------------------

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const rows = ["id,link,file"];

  for (let i = 0; i < TOTAL; i++) {
    const id = START_ID + i;
    const url = `${DOMAIN}/setup/${id}`;
    const filename = path.join(OUTPUT_DIR, `qr-${id}.png`);

    await QRCode.toFile(filename, url, {
      width: 500,
      margin: 2,
    });

    rows.push(`${id},${url},qr-${id}.png`);
    console.log(`Selesai: ${filename}`);
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "daftar-qrcode.csv"), rows.join("\n"));
  console.log(`\nSelesai semua! ${TOTAL} QR code ada di folder "${OUTPUT_DIR}/"`);
  console.log(`Daftarnya juga dicatat di "${OUTPUT_DIR}/daftar-qrcode.csv"`);
}

main();
