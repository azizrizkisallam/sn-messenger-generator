# SobatNgaji Message Generator (SN Messenger Generator)

> Aplikasi web modern untuk membersihkan database peserta, mendeteksi sapaan & kode gender (R/N), menghasilkan pesan WhatsApp personal dengan *Natural Message Structure Engine*, dan memfasilitasi alur pengiriman manual Click to WhatsApp tanpa otomasi bot.

🌐 **Live Demo**: [https://sn-messenger-generator.vercel.app](https://sn-messenger-generator.vercel.app)

---

## 🌟 Fitur Utama

### 1. Database Parsing & Smart Cleaning
- **Multi-Format Input**: Mendukung copy-paste tabel Google Sheets / Excel (TSV, pipe separator, maupun teks baris bebas).
- **Pembersihan Otomatis**: Memisahkan nama dari keterangan kota/daerah tanpa memotong gelar/inisial (contoh: `Ambar Susanto | L - Bandung`, `Rita SM -`, `Eriga Bernadia - Bekasi`).
- **Gender Mapping Prioritas**: Mendukung kode gender spreadsheet `R` (Laki-laki / Bapak) dan `N` (Perempuan / Ibu) yang mengalahkan estimasi tebakan nama kamus.
- **Normalisasi Nomor Telepon**: Mengubah format `08...`, `+62...`, maupun ber-spasi menjadi format internasional `628...` standar WhatsApp.
- **Deteksi Duplikasi Berjenjang**:
  1. ID Peserta (misal `SN1`)
  2. Nomor WhatsApp
  3. Nama (hanya jika data tanpa ID dan tanpa No WA)
  *(Dua kontak dengan nama sama namun nomor telepon berbeda tidak dianggap duplikat)*.

### 2. Natural Message Structure Engine
- **6 Pola Pembuka Personal**:
  - **Pola A**: Salam dahulu (*Assalamu'alaikum, {{sapaan}} {{nama}} 😊*)
  - **Pola B**: Sapaan dahulu (*{{sapaan}} {{nama}}, apa kabar? Semoga selalu dalam kebaikan. 🌿*)
  - **Pola C**: Nama langsung (*Halo, {{sapaan}} {{nama}}!*)
  - **Pola D**: Pembuka hangat (*Semoga hari ini penuh keberkahan untuk {{sapaan}} {{nama}}.*)
  - **Pola E**: Salam singkat & doa (*Assalamu'alaikum, {{sapaan}} {{nama}}. Semoga senantiasa sehat...*)
  - **Pola F**: Sapaan personal (*Apa kabar, {{sapaan}} {{nama}}? 😊*)
- **4 Susunan Alur Pesan**:
  - Alur 1: Pembuka → Benefit → Ajakan → CTA
  - Alur 2: Sapaan ringkas → Benefit → CTA
  - Alur 3: Salam Doa → Sapaan & Benefit → CTA
  - Alur 4: Sapaan → Konteks SobatNgaji → Benefit → CTA
- **Konsistensi Penawaran Mutlak**:
  Setiap pesan terjamin memuat klausul resmi:
  `*1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*`
  Tanpa klaim kelangkaan palsu, tanpa acara Ahad, dan tanpa Zoom.
- **Word Counter**: Indikator panjang kata real-time (target ideal 30–50 kata).

### 3. Click to WhatsApp & Delivery Workflow
- **Deep Link Resmi WhatsApp**: Menghasilkan link `https://wa.me/628xxxxxxxxxx?text=...` dengan URL encoding presisi (mempertahankan baris baru, format `*bold*`, `_italic_`, dan emoji).
- **Multi-Platform Support**:
  - Universal (`wa.me`)
  - WhatsApp Web (`web.whatsapp.com`)
  - WhatsApp Desktop (`whatsapp://`)
- **Tracking Pengiriman Manual**:
  - Status: `Belum dibuka`, `WhatsApp dibuka`, `Sudah dikonfirmasi terkirim`, `Dilewati`.
  - Progress bar pengiriman pada Dashboard.
  - Mematuhi etika pengiriman pesan berbasis izin (permission-based messaging).

### 4. Ekspor & Manajemen Data
- **Ekspor Data**: Mendukung ekspor ke format Excel (`.xlsx`) dan CSV dengan seluruh kolom (ID, Nama, Gender, Sapaan, WhatsApp, Status, Pesan).
- **Kamus Sapaan Kustom**: Tambah, cari, dan hapus aturan nama khusus secara lokal.
- **Backup & Restore**: Simpan seluruh database dan preferensi dalam format JSON lokal.
- **100% Client-Side Privacy**: Data tidak pernah dikirim ke server backend eksternal.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Spreadsheet Processing**: [XLSX (SheetJS)](https://sheetjs.com/)
- **Unit & Integration Testing**: [Vitest](https://vitest.dev/) + Testing Library

---

## 🚀 Memulai (Local Setup)

### 1. Clone Repository
```bash
git clone https://github.com/azizrizkisallam/sn-messenger-generator.git
cd sn-messenger-generator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

### 4. Menjalankan Rangkaian Pengujian
```bash
npx vitest run
```

### 5. Build untuk Produksi
```bash
npm run build
```

---

## 🔒 Privasi & Keamanan

Aplikasi ini beroperasi 100% pada peramban pengguna (client-side browser). Seluruh data peserta, nomor telepon, dan pesan disimpan secara lokal (`localStorage`). Tidak ada pengiriman data ke pihak ketiga atau tracking otomatis. Pengiriman pesan WhatsApp dilakukan manual satu-per-satu melalui WhatsApp Web / Desktop resmi demi mematuhi ketentuan layanan WhatsApp.

---

## 📄 Lisensi

Distributed under the MIT License.
