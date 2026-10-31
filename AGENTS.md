# AGENTS.md — TeleKarang

Panduan untuk AI agent yang membangun TeleKarang: sistem telemedicine kepulauan untuk Puskesmas Pulau Karang. Bagian 0 berisi fakta teknis repo; bagian 1–12 adalah spesifikasi produk yang wajib dipatuhi.

## 0. Repo & Perintah (baca dulu)

**Stack nyata:** Laravel 12 + Inertia v2 + React 19 + TypeScript + Tailwind CSS v4 (CSS-first, tanpa `tailwind.config.js`) + shadcn/ui + lucide-react + Ziggy. Pest untuk tes. DB SQLite (`database/database.sqlite`). Bukan Next.js.

**Status repo:** masih starter kit Laravel React. Landing page TeleKarang ada di `resources/js/pages/welcome.tsx` (route `/`), halaman login/registrasi bertema di `resources/js/pages/auth/` (layout bersama `layouts/auth/auth-telekarang-layout.tsx`), dan kolom `users.role` (default `pasien`) sudah ada. Baru ada auth, settings, `dashboard`; belum ada model/tabel/route/halaman domain TeleKarang lain. Mulai dari fondasi (bagian 11).

Perintah (jalankan dari root):

```powershell
composer install; npm install
composer dev                 # php artisan serve + queue:listen + vite sekaligus
php artisan migrate:fresh --seed
./vendor/bin/pest            # semua tes
./vendor/bin/pest tests/Feature/Auth/AuthenticationTest.php
./vendor/bin/pest --filter=nama_tes
php artisan test --filter=nama_tes   # alternatif
./vendor/bin/pint            # format PHP
npx tsc --noEmit             # typecheck (tidak ada script npm khusus)
npm run format               # prettier resources/
npm run format:check
npm run lint                 # eslint --fix
npm run build
```

Di PowerShell, jalankan `php vendor/bin/pest` dan `php vendor/bin/pint` (bukan `./vendor/bin/...`). Urutan verifikasi sebelum selesai: `pint` → `format` → `lint` → `tsc --noEmit` → `pest`. Itu yang dijalankan CI (`.github/workflows/lint.yml`, `tests.yml`; branch `develop`/`main`).

**Penting:**
- PHP lokal 8.2.12, CI 8.4. Jangan pakai fitur di atas 8.2. Node lokal 24, CI 22.
- Baseline: `npx tsc --noEmit` masih gagal di `auth/reset-password.tsx` (`FormDataType`). Bukan regresi perubahanmu; perbaiki bila menyentuh file itu.
- Tes `Feature/*` otomatis memakai `RefreshDatabase` dan SQLite `:memory:` (lihat `tests/Pest.php`); tes `Unit/*` tidak.
- Halaman Inertia di `resources/js/pages`, di-resolve dari nama komponen (`Inertia::render('pasien/beranda')` → `resources/js/pages/pasien/beranda.tsx`). Gunakan alias `@/*` → `resources/js/*` dan helper global `route()` (Ziggy).
- Shared props Inertia (`auth.user`, `name`, `quote`) ada di `app/Http/Middleware/HandleInertiaRequests.php`. Setiap field yang dibutuhkan frontend (mis. `role`) harus ditambahkan di sana.
- UI: pakai komponen `resources/js/components/ui/*` dan `cn()` dari `@/lib/utils`, ikon lucide. `components.json` menunjuk `tailwind.config.js` yang **tidak ada** (Tailwind v4); jangan membuat file itu, taruh token di `resources/css/app.css` via `@theme`/`:root`.
- Token palet hijau-teal bagian 7 sudah ditambahkan sebagai warna `tk-*` dan variabel `--tk-*` di `resources/css/app.css` (dipakai landing page); tema shadcn netral masih dipakai komponen aplikasi lain. Font sudah Plus Jakarta Sans.
- Bahasa UI TeleKarang: Indonesia. Halaman starter masih Inggris; terjemahkan saat menyentuhnya.
- Recharts/Chart.js belum terpasang. Boleh ditambah untuk dasbor, tapi jelaskan alasannya (bagian 2).
- Booleans/enum status: gunakan string status persis seperti bagian 4 (mis. `MENUNGGU_SKRINING`) agar filter dan label konsisten.
- Data selalu fiktif. Jangan commit `.env`, kredensial, atau data nyata.
- Belum ada `README.md` dan repo ini belum di-`git init`; DoD mewajibkan README berisi cara jalan, akun demo, dan catatan data fiktif.
- Laravel Boost MCP tersedia (`opencode.json` → `php artisan boost:mcp`); gunakan `search-docs`/`database-schema` untuk verifikasi API Laravel/Inertia, dan skill di `.agents/skills/` bila relevan.

---
1. Konteks Proyek
Studi kasus (Kasus A2): Puskesmas di pulau berjarak ±3 jam perjalanan kapal dari RS rujukan, hanya ada 1 dokter umum, tanpa dokter spesialis, dan sinyal internet tidak stabil. Sekitar 4 dari 10 rujukan ke daratan sebenarnya bisa diselesaikan lewat konsultasi jarak jauh. Pasien menanggung biaya dan waktu perjalanan, dan jadwal dokter spesialis RS tidak diketahui puskesmas.
Tiga masalah yang harus dijawab sistem:
Puskesmas tidak tahu jadwal dokter spesialis.
Sinyal tidak stabil.
Rujukan yang sebenarnya tidak perlu merugikan pasien (biaya dan waktu).
Fitur minimum (wajib, dari soal):
Daftar jadwal dokter spesialis dan pendaftaran konsultasi oleh perawat atau pasien.
Alur konsultasi (boleh disimulasikan dengan tautan video atau pesan teks).
Catatan hasil konsultasi dan saran, termasuk keputusan rujuk atau tidak, dengan diagnosis dari daftar ICD-10.
Mode koneksi rendah (konsultasi teks atau unggah foto) disertai penjelasan alasannya.
Nilai tambah: dasbor jumlah konsultasi dan rujukan yang terhindarkan.
Data uji (fiktif, minimal): 10 pasien, 3 dokter, 8 konsultasi.
---
2. Aturan untuk AI Agent
Semua data adalah fiktif. Jangan memakai data pribadi atau medis nyata.
Bahasa antarmuka: Bahasa Indonesia. Nama variabel, fungsi, dan tabel: bahasa Inggris atau konsisten dengan skema di bagian 9.
Utamakan fitur minimum dulu, baru nilai tambah (lihat bagian 11).
Mobile-first. Pengguna utama memakai ponsel dengan sinyal lemah.
Jangan membuat konsultasi bisa dikirim ke spesialis sebelum skrining perawat lengkap (aturan gerbang di bagian 4).
Setiap hasil konsultasi wajib memuat diagnosis ICD-10 dan keputusan rujuk/tidak.
Ikuti design system di bagian 7. Jangan mengganti palet warna, gaya kartu, atau pola navigasi tanpa diminta.
Terapkan RBAC: pengguna hanya melihat halaman dan data sesuai perannya.
Jangan menambah dependensi besar tanpa alasan. Jelaskan singkat bila menambah library.
Tulis kode yang bisa dijalankan dan sertakan seed data fiktif.
Jika instruksi ambigu, pilih opsi paling sederhana yang memenuhi fitur minimum, dan catat asumsinya.
Tech stack yang dipakai (jangan diganti tanpa diminta)
Laravel 12 + Inertia v2 + React 19 + TypeScript (mobile-first).
Tailwind CSS v4 + shadcn/ui; token warna di `resources/css/app.css` (tanpa `tailwind.config.js`).
Database SQLite untuk prototipe. Offline: Service Worker + IndexedDB untuk draf dan antrean pesan.
Grafik dasbor: Recharts atau Chart.js (belum terpasang; tambahkan hanya saat mengerjakan dasbor).
---
3. Aktor dan Hak Akses (RBAC)
Aktor	Peran	Hak akses utama
Pasien (akun opsional)	`pasien`	Lihat jadwal spesialis, buat permintaan konsultasi, lihat status dan hasil miliknya (skrining read-only)
Perawat	`perawat`	Daftarkan pasien, isi skrining, ajukan konsultasi, tindak lanjut hasil
Dokter umum puskesmas	`dokter_umum`	Review skrining, putuskan perlu spesialis atau tidak, tindak lanjut
Dokter spesialis RS	`spesialis`	Kelola jadwal, terima/tolak/jadwal ulang, konsultasi, isi hasil (ICD-10, saran, rujuk)
Admin	`admin`	Kelola pengguna, dokter, ICD-10, lihat dasbor dan log aktivitas
Pasien tanpa akun tetap bisa dilayani: perawat mendaftarkan dan membuat permintaan atas namanya.
---
4. Alur Sistem
Alur A: Permintaan dari akun pasien
```
[1]  Pasien login → lihat jadwal spesialis → buat Permintaan Konsultasi
     (keluhan + spesialisasi + slot)                    status: MENUNGGU_SKRINING
[2]  Pasien datang ke puskesmas
[3]  Perawat buka daftar permintaan → pilih pasien → isi form skrining
     (BB, TB, tensi, suhu, nadi, SpO2, keluhan utama)   status: SKRINING_SELESAI
[4]  Triase otomatis
       ├─ Ada tanda bahaya → peringatan "SEGERA RUJUK / GAWAT DARURAT", prioritas
       └─ Tidak ada → lanjut
[5]  Dokter umum review → setuju kirim ke spesialis / tangani sendiri
[6]  Permintaan diteruskan ke spesialis                 status: MENUNGGU_SPESIALIS
[7]  Spesialis: konfirmasi / jadwal ulang / tolak (alasan)  status: DIKONFIRMASI
[8]  Sistem cek kualitas koneksi → tentukan mode
       ├─ Baik  → Mode Standar (tautan video + chat)
       └─ Buruk → Mode Koneksi Rendah (teks + foto terkompres, asynchronous)
[9]  Konsultasi berlangsung                             status: BERLANGSUNG
[10] Spesialis isi hasil: diagnosis ICD-10, saran, keputusan rujuk   status: SELESAI
[11] Perawat/dokter umum menerima hasil
       ├─ Tidak rujuk → tindakan di puskesmas (dihitung "rujukan terhindarkan")
       └─ Rujuk → catat alasan dan biaya rujukan, bantu proses rujukan
[12] Data masuk ke dasbor
```
Alur B: Pasien tanpa akun
Langkah 1 dilewati. Perawat mendaftarkan pasien dan membuat permintaan langsung, lalu lanjut ke langkah 3 pada hari yang sama.
Alur C: Kasus khusus
Tidak diskrining dalam batas waktu (default 3 hari) → `KEDALUWARSA`, slot dilepas.
Spesialis menolak atau menjadwal ulang → pasien dan perawat dinotifikasi, pilih slot baru.
Sinyal putus saat konsultasi → pesan disimpan di perangkat dan terkirim otomatis saat sinyal kembali.
Status konsultasi
`MENUNGGU_SKRINING → SKRINING_SELESAI → MENUNGGU_SPESIALIS → DIKONFIRMASI → BERLANGSUNG → SELESAI`
Cabang: `DIJADWAL_ULANG`, `DITOLAK`, `KEDALUWARSA`, `DIBATALKAN`.
Aturan bisnis kunci
Tombol "Kirim ke Spesialis" terkunci sampai data skrining lengkap.
Hanya perawat yang boleh mengisi atau mengubah skrining. Pasien hanya melihat (read-only).
Pasien hanya boleh mengubah keluhan subjektifnya.
Validasi rentang skrining (contoh: suhu 30–45 °C, nadi 30–220, SpO2 50–100, sistol 50–260, diastol 30–150). Nilai tidak masuk akal ditolak.
Triase: SpO2 < 92, sistol ≥ 180 atau diastol ≥ 120, suhu ≥ 40, nadi > 130 atau < 40, atau keluhan "sesak berat" / "tidak sadar" memunculkan peringatan merah.
Keputusan rujuk/tidak wajib diisi spesialis. Alasan wajib jika rujuk.
---
5. Daftar Fitur
A. Fitur minimum
Jadwal dan pendaftaran konsultasi: daftar spesialis, spesialisasi, jadwal; status slot (tersedia/terisi/libur); filter spesialisasi; pendaftaran oleh perawat atau pasien.
Alur konsultasi: status berjenjang; simulasi video via kolom tautan atau chat teks; spesialis bisa konfirmasi, jadwal ulang, tolak.
Catatan hasil konsultasi: keluhan, data skrining (terisi otomatis), diagnosis (dropdown ICD-10 dengan pencarian), saran, keputusan rujuk (wajib), alasan rujuk; riwayat per pasien.
Mode koneksi rendah: deteksi otomatis (uji kecepatan kecil) plus toggle manual; hanya teks dan unggah foto (kompres di klien); asynchronous; penjelasan alasan di UI, contoh: "Sinyal lemah terdeteksi. Beralih ke mode teks agar konsultasi tetap berjalan tanpa terputus."
B. Fitur pendukung alur
Manajemen akun pasien (opsional) dan pendaftaran pasien oleh perawat.
Form skrining perawat dengan validasi rentang.
Gerbang skrining (tombol kirim terkunci, skrining read-only bagi pasien).
Kedaluwarsa otomatis permintaan yang tidak diskrining.
Manajemen jadwal praktik oleh spesialis.
Manajemen data master oleh admin (pengguna, dokter, ICD-10).
C. Nilai tambah: dasbor
Total konsultasi (harian/mingguan/bulanan).
Jumlah dan persentase rujukan terhindarkan (target cerita kasus ±40%).
Estimasi penghematan biaya dan waktu: rujukan terhindarkan × biaya rata-rata kapal dan waktu tempuh (±3 jam sekali jalan).
Diagnosis terbanyak, distribusi per spesialisasi, rasio mode video vs teks, rata-rata waktu tunggu.
Filter periode dan ekspor CSV/PDF.
D. Saran tambahan (nilai lebih tinggi)
Fitur	Alasan
Offline-first / PWA, draf tersimpan dan sinkron otomatis	Menjawab sinyal tidak stabil
Indikator koneksi (hijau/kuning/merah) di semua halaman	Pengguna paham kenapa mode berganti
Triase otomatis	Keselamatan pasien
Notifikasi in-app dan simulasi WhatsApp/SMS	Pasien tidak bolak-balik ke puskesmas
Audit trail (siapa mengubah apa, kapan)	Wajar untuk data medis
RBAC ketat	Pasien hanya melihat datanya sendiri
Ringkasan hasil berbahasa sederhana untuk pasien	Literasi kesehatan beragam
Catatan privasi dan etika (data fiktif, enkripsi, persetujuan)	Poin plus laporan
Kolom biaya rujukan saat rujuk	Mempertajam hitungan dasbor
---
6. Daftar Halaman
Umum
#	Halaman	Route
1	Landing page	`/`
2	Login	`/login`
3	Registrasi pasien	`/register`
Pasien
#	Halaman	Route
4	Beranda pasien (status permintaan aktif)	`/pasien`
5	Jadwal dokter spesialis	`/pasien/jadwal`
6	Buat permintaan konsultasi	`/pasien/konsultasi/baru`
7	Detail konsultasi (status, skrining read-only, hasil, chat)	`/pasien/konsultasi/[id]`
8	Riwayat konsultasi	`/pasien/riwayat`
9	Profil	`/pasien/profil`
Perawat
#	Halaman	Route
10	Dasbor perawat (antrean skrining hari ini)	`/perawat`
11	Daftar permintaan masuk	`/perawat/permintaan`
12	Form skrining pasien	`/perawat/skrining/[konsultasiId]`
13	Pendaftaran dan pencarian pasien	`/perawat/pasien`
14	Ajukan konsultasi (pasien tanpa akun)	`/perawat/konsultasi/baru`
15	Detail konsultasi dan ruang konsultasi	`/perawat/konsultasi/[id]`
16	Tindak lanjut hasil (rujuk / tidak)	`/perawat/tindak-lanjut/[id]`
Dokter umum
#	Halaman	Route
17	Daftar skrining untuk direview	`/dokter/review`
18	Detail pasien dan keputusan teruskan ke spesialis	`/dokter/review/[id]`
19	Hasil konsultasi dan tindak lanjut	`/dokter/hasil/[id]`
Dokter spesialis
#	Halaman	Route
20	Dasbor spesialis	`/spesialis`
21	Kelola jadwal praktik	`/spesialis/jadwal`
22	Daftar permintaan (terima/tolak/jadwal ulang)	`/spesialis/permintaan`
23	Ruang konsultasi (standar atau teks)	`/spesialis/konsultasi/[id]`
24	Form hasil konsultasi (ICD-10, saran, rujuk)	`/spesialis/hasil/[id]`
Admin
#	Halaman	Route
25	Dasbor statistik (nilai tambah)	`/admin`
26	Kelola pengguna dan peran	`/admin/pengguna`
27	Kelola data dokter	`/admin/dokter`
28	Kelola data ICD-10	`/admin/icd10`
29	Log aktivitas	`/admin/log`
Komponen global
Indikator koneksi dan penjelasan mode.
Pusat notifikasi (ikon lonceng).
Halaman error/offline: "Anda sedang offline, draf tersimpan."
---
7. Design System (mengikuti referensi gambar)
Referensi gaya: aplikasi mobile bertema hijau-teal gelap bergradasi (glassmorphism) dengan kartu membulat besar, ikon aksi bulat, banner gradasi hijau, dan navigasi bawah. Tersedia mode gelap dan terang. Gunakan tata letak "Design 1" sebagai default (header gradasi + ikon aksi bulat + banner + kartu horizontal). Pola "Design 2" (kartu besar bertumpuk + tombol cari melayang di tengah bawah) dan "Design 3" (kolom pencarian di header + tab filter + navigasi bawah mengambang) boleh dipakai di halaman tertentu.
7.1 Palet warna (token)
```css
:root {
  /* Hijau-teal utama */
  --color-bg-deep:      #04100E; /* latar paling gelap */
  --color-teal-900:     #0A2A27;
  --color-teal-700:     #0F4A40;
  --color-green-500:    #2E8B6A; /* gradasi tengah */
  --color-green-400:    #4FBF8F; /* gradasi banner */
  --color-accent:       #7CC77F; /* aksen: tab aktif, FAB, ikon aktif */
  --color-mint-glow:    #9FE3B5;

  /* Netral */
  --color-text:         #FFFFFF;
  --color-text-muted:   #A8C4BC;
  --color-surface-dark: rgba(255,255,255,0.06); /* kartu glass di dark */
  --color-border-dark:  rgba(255,255,255,0.14);

  /* Terang */
  --color-bg-light:     #FFFFFF;
  --color-surface-light:#F1F4F3;
  --color-text-dark:    #0E1F1B;

  /* Status */
  --color-success: #3FBF7F;
  --color-warning: #F2B84B;
  --color-danger:  #E5484D; /* triase / segera rujuk */
  --color-info:    #4BA3F2;
}
```
Gradasi header/hero (dark): `linear-gradient(160deg, #04100E 0%, #0A2A27 35%, #2E8B6A 100%)`.
Gradasi banner: `linear-gradient(135deg, #1F6F57 0%, #4FBF8F 60%, #7CC77F 100%)`.
7.2 Tipografi
Font: sans-serif geometris modern (rekomendasi Plus Jakarta Sans atau Manrope; cadangan `system-ui`).
Angka besar (ringkasan utama): 32–40 px, weight 500–600.
Judul seksi: 16–18 px, weight 600. Isi: 14 px. Label kecil: 11–12 px.
Teks putih di atas gradasi gelap; teks `--color-text-dark` di mode terang.
7.3 Bentuk dan efek
Radius kartu: 20–28 px. Tombol bulat penuh (`999px`). Tag/pill: 999px.
Efek glass: `backdrop-filter: blur(16px)`, border tipis `--color-border-dark`.
Header berbentuk "lembah": sudut bawah membulat besar (28–32 px), konten ikon aksi menumpuk di bawah header dengan lengkung.
Bayangan lembut, tanpa kontras keras. Hindari warna di luar palet hijau-teal kecuali status.
7.4 Pola komponen
Komponen	Spesifikasi
Header profil	Avatar bulat berbingkai hijau (kiri), sapaan "Hai, {nama}", ikon lonceng dalam lingkaran (kanan), toggle terang/gelap
Kartu ringkasan utama	Label kecil di atas, angka besar, indikator perubahan hijau (+), ikon mata untuk sembunyikan angka
Ikon aksi bulat	4 tombol lingkaran outline dengan label di bawah; terakhir selalu "Lainnya"
Banner gradasi	Kartu hijau bergradasi, judul tebal kapital, tombol "pill" kecil, indikator titik (carousel)
Kartu horizontal	Foto/ilustrasi di atas, tag pill, info singkat; scroll horizontal
Tab filter (chip)	Chip menyamping; chip aktif berlatar `--color-accent`
Navigasi bawah	4 item ikon + label; item aktif berwarna `--color-accent`; boleh mengambang berbentuk pil
FAB cari	Lingkaran hijau di tengah bawah (opsional, Design 2)
Kolom pencarian	Pil gelap di header (Design 3)
7.5 Pemetaan tema ke TeleKarang
Elemen di gambar	Dipakai di TeleKarang sebagai
"Total Balance"	Rujukan Terhindarkan (angka besar, ±% naik) di beranda perawat/admin; di pasien: status konsultasi aktif
Ikon aksi (Withdraw, Document, Calculator, More)	Perawat: Skrining, Pasien, Jadwal, Lainnya. Pasien: Buat Konsultasi, Jadwal, Riwayat, Lainnya
Banner "The Future Assets of Crypto"	Banner info/edukasi, mis. "Konsultasi spesialis tanpa naik kapal" atau status mode koneksi
Kartu horizontal properti	Kartu dokter spesialis (foto, nama, spesialisasi, slot terdekat)
Tab filter (Crypto, Stock, Real Estate...)	Filter spesialisasi (Semua, Anak, Penyakit Dalam, Kulit, Kandungan)
Navigasi bawah (Home, Market, Overview, Wallet)	Lihat 7.6
Ikon lonceng	Pusat notifikasi
Toggle bulan/matahari	Mode gelap/terang
7.6 Navigasi bawah per peran
Peran	Item 1	Item 2	Item 3	Item 4
Pasien	Beranda	Jadwal	Riwayat	Profil
Perawat	Beranda	Antrean	Pasien	Profil
Dokter umum	Beranda	Review	Riwayat	Profil
Spesialis	Beranda	Permintaan	Jadwal	Profil
Admin	Dasbor	Pengguna	Master	Log
7.7 Indikator koneksi (wajib tampil)
Lencana kecil di header: hijau "Stabil", kuning "Lemah", merah "Offline".
Saat beralih ke mode koneksi rendah, tampilkan banner gradasi dengan alasan: "Sinyal lemah terdeteksi. Beralih ke mode teks agar konsultasi tetap berjalan tanpa terputus."
7.8 Aksesibilitas
Kontras teks minimal WCAG AA, khususnya di atas gradasi.
Target sentuh minimal 44×44 px.
Status tidak hanya dengan warna: sertakan ikon dan teks.
---
8. Mode Koneksi Rendah (detail teknis)
Deteksi: ukur waktu unduh berkas kecil atau pakai `navigator.connection` bila tersedia. Ambang contoh: > 1,5 detik atau `effectiveType` ≤ `2g` → mode rendah.
Pengguna bisa mengganti mode manual (toggle).
Mode rendah: tanpa video; chat teks dan unggah foto dikompres di klien (maks ±200 KB, resize sisi terpanjang ~1024 px).
Pesan masuk antrean IndexedDB bila offline, status "Menunggu kirim", kirim otomatis saat online.
Selalu tampilkan alasan peralihan mode di UI.
---
9. Skema Data
Tabel `users` bawaan memakai `name`/`email`/`password`; tambahkan `role` lewat migration baru (jangan rename kolom bawaan). Nama tabel/kolom domain memakai bahasa Indonesia sesuai daftar ini.
Tabel	Kolom utama
`users`	id, nama, email/username, password_hash, role
`pasien`	id, user_id (nullable), nama, nik, tgl_lahir, jenis_kelamin, alamat
`dokter`	id, user_id, nama, peran (umum/spesialis), spesialisasi, faskes
`jadwal`	id, dokter_id, hari, jam_mulai, jam_selesai, status (tersedia/terisi/libur)
`konsultasi`	id, pasien_id, dibuat_oleh, dokter_pengirim_id, dokter_spesialis_id, jadwal_id, mode (video/teks), status, keluhan, tanggal, kedaluwarsa_pada
`skrining`	id, konsultasi_id, perawat_id, berat, tinggi, sistol, diastol, suhu, nadi, spo2, tanda_bahaya (bool), catatan, waktu
`hasil_konsultasi`	id, konsultasi_id, icd10_kode, saran, keputusan_rujuk (bool), alasan_rujuk, biaya_rujukan, waktu
`icd10`	kode, nama_diagnosis
`pesan`	id, konsultasi_id, pengirim_id, isi, lampiran_foto, status_kirim, waktu
`notifikasi`	id, user_id, judul, isi, dibaca, waktu
`audit_log`	id, user_id, aksi, entitas, entitas_id, waktu
---
10. Data Uji Fiktif (seed)
10 pasien: variasi usia dan keluhan khas pulau (ISPA, diare, hipertensi, luka kulit, demam, dll.). Sebagian punya akun, sebagian tidak.
3 dokter: 1 dokter umum puskesmas, 1 spesialis anak, 1 spesialis penyakit dalam (opsional tambah spesialis kulit).
8 konsultasi: ±3 berujung rujuk dan ±5 tidak rujuk (agar dasbor mendekati ±40% terhindarkan atau lebih). Campur mode video dan teks. Sertakan minimal 1 kasus triase merah dan 1 permintaan kedaluwarsa.
ICD-10: minimal 20 diagnosis umum (mis. J06.9 ISPA, A09 diare, I10 hipertensi, L30.9 dermatitis, R50.9 demam).
Akun demo: satu per peran, password demo ditulis di README (data fiktif).
---
11. Urutan Pengerjaan
Fondasi: setup proyek, design tokens (bagian 7), login + RBAC, seed data.
Wajib (fitur minimum): data pasien, skrining, jadwal, pendaftaran konsultasi, ruang konsultasi simulasi, hasil + ICD-10 + keputusan rujuk, mode koneksi rendah.
Nilai tambah: dasbor rujukan terhindarkan, estimasi penghematan, grafik.
Penyempurnaan: triase, notifikasi, PWA/offline, audit log, ekspor CSV/PDF, mode terang/gelap.
12. Definition of Done
[ ] Empat fitur minimum berjalan end-to-end.
[ ] Alur A dan B bisa didemokan dari awal sampai dasbor.
[ ] Skrining menjadi gerbang sebelum kirim ke spesialis.
[ ] Mode koneksi rendah bekerja dan menampilkan alasan di UI.
[ ] Hasil konsultasi memuat ICD-10 dan keputusan rujuk/tidak.
[ ] Dasbor menampilkan jumlah konsultasi dan rujukan terhindarkan.
[ ] Seed data memenuhi minimal 10 pasien, 3 dokter, 8 konsultasi.
[ ] Tampilan mengikuti design system hijau-teal (mode gelap dan terang).
[ ] RBAC berfungsi; pasien hanya melihat datanya sendiri.
[ ] README berisi cara menjalankan, akun demo, dan catatan bahwa semua data fiktif.