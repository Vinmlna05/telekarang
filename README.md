# TeleKarang

Sistem telemedicine kepulauan untuk Puskesmas Pulau Karang: pasien mengajukan konsultasi, perawat melakukan skrining, dokter umum memutuskan, lalu dokter spesialis RS memberikan hasil dengan diagnosis ICD-10 dan keputusan rujuk.

> Semua data di repo ini **fiktif**. Jangan memasukkan data pribadi atau medis nyata.

## Stack

- Laravel 12 + Inertia v2 + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first, tanpa `tailwind.config.js`) + shadcn/ui
- SQLite (`database/database.sqlite`)
- Pest untuk tes

## Menjalankan

```powershell
composer install
npm install
copy .env.example .env        # bila belum ada .env
php artisan key:generate
php artisan migrate:fresh --seed
composer dev                  # serve + queue + vite
```

Atau jalankan terpisah: `php artisan serve` dan `npm run dev`.

## Akun demo

Semua akun memakai password `password`, kecuali admin (`12345678`).

| Peran | Email | Password |
| --- | --- | --- |
| Pasien | `aisyah@telekarang.test` | `password` |
| Pasien | `salim@telekarang.test` | `password` |
| Perawat | `perawat@telekarang.test` | `password` |
| Dokter umum | `dokter@telekarang.test` | `password` |
| Dokter spesialis | `spesialis@telekarang.test` | `password` |
| Admin | `reiki@gmail.com` | `12345678` |

Spesialis lain (Hendra, Maya, Rina) juga punya akun dengan pola email yang sama di `database/seeders/MasterDataSeeder.php`.

## Alur demo

1. Pasien (atau perawat lewat `/perawat/konsultasi/baru`) membuat permintaan dan memilih tanggal skrining hari kerja.
2. Perawat mengisi skrining di `/perawat/skrining/{id}`; tombol kirim ke spesialis terkunci sampai skrining lengkap.
3. Dokter umum memutuskan di `/dokter/review/{id}`: konsultasi spesialis, rujuk langsung, atau tangani di puskesmas.
4. Perawat memilih dokter spesialis + slot di `/perawat/konsultasi/{id}`.
5. Spesialis mengonfirmasi/jadwal ulang/tolak di `/spesialis/permintaan`, lalu chat di `/spesialis/konsultasi/{id}` dan mengisi hasil di `/spesialis/hasil/{id}`.
6. Perawat menindaklanjuti hasil di `/perawat/tindak-lanjut/{id}`; angka rujukan terhindarkan muncul di dasbor.

## Seed data

`migrate:fresh --seed` membuat 10 pasien, 5 dokter (2 umum, 3 spesialis), 10 konsultasi dengan campuran status (termasuk triase merah dan permintaan kedaluwarsa), skrining, hasil ICD-10, jadwal, notifikasi, dan audit log — semuanya fiktif.

Registrasi staff dokter lewat `/admin/pengguna` otomatis membuat profil dokter. Bila ada akun dokter lama tanpa profil dokter, jalankan `php artisan telekarang:tautkan-dokter`.

## Verifikasi

```powershell
php vendor/bin/pint
npm run format
npm run lint
npx tsc --noEmit
php vendor/bin/pest
```

> Catatan: `npx tsc --noEmit` masih gagal di `resources/js/pages/auth/reset-password.tsx` (tipe `FormDataType`) karena halaman starter; bukan bagian alur TeleKarang.
