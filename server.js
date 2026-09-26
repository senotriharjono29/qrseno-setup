const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data.json");

// ---------- "Database" sederhana (file JSON) ----------
// Untuk produksi dengan banyak instance/serverless, ganti dengan
// MySQL / Airtable / Google Sheets API supaya datanya tidak hilang.
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return {};
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

app.use(express.urlencoded({ extended: true }));

// ---------- Halaman + logika redirect ----------
// GET /setup/:id  -> dipanggil setiap kali QR di-scan
app.get("/setup/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const entry = db[id];

  if (entry && entry.mapsLink) {
    // Sudah pernah diisi -> langsung redirect ke Google Maps usaha pembeli
    return res.redirect(302, entry.mapsLink);
  }

  // Belum ada link -> tampilkan form setup
  res.send(renderSetupForm(id));
});

// POST /setup/:id -> submit form pertama kali
app.post("/setup/:id", (req, res) => {
  const { id } = req.params;
  const mapsLink = (req.body.mapsLink || "").trim();

  if (!isValidUrl(mapsLink)) {
    return res
      .status(400)
      .send(renderSetupForm(id, "Link tidak valid. Pastikan link Google Maps benar (harus diawali https://)."));
  }

  const db = loadDB();
  db[id] = {
    mapsLink,
    createdAt: new Date().toISOString(),
  };
  saveDB(db);

  // Setelah disimpan, langsung arahkan ke Maps-nya juga
  res.redirect(302, mapsLink);
});

// (Opsional) endpoint untuk reset/ubah link kalau perlu edit ulang
app.post("/setup/:id/reset", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  delete db[id];
  saveDB(db);
  res.redirect(`/setup/${id}`);
});

function renderSetupForm(id, error) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Setup QR - ${id}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f4f6f8;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
  }
  .card {
    background: #fff;
    padding: 32px 28px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    max-width: 400px;
    width: 90%;
  }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p.sub { color: #666; font-size: 14px; margin-top: 0; margin-bottom: 20px; }
  label { font-size: 13px; font-weight: 600; color: #333; display: block; margin-bottom: 6px; }
  input[type=url] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
  }
  button {
    margin-top: 16px;
    width: 100%;
    padding: 12px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
  button:hover { background: #1d4ed8; }
  .error {
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }
  .id-badge {
    display: inline-block;
    background: #eef2ff;
    color: #4338ca;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    margin-bottom: 12px;
  }
</style>
</head>
<body>
  <div class="card">
    <span class="id-badge">QR #${id}</span>
    <h1>Setup Link Google Maps</h1>
    <p class="sub">Tempel link Google Maps lokasi usahamu. Setelah disimpan, QR ini akan otomatis mengarah ke lokasimu setiap kali di-scan.</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/setup/${id}">
      <label for="mapsLink">Link Google Maps</label>
      <input type="url" id="mapsLink" name="mapsLink" placeholder="https://maps.app.goo.gl/xxxxx" required>
      <button type="submit">Simpan &amp; Aktifkan QR</button>
    </form>
  </div>
</body>
</html>`;
}

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  console.log(`Contoh: http://localhost:${PORT}/setup/123`);
});
