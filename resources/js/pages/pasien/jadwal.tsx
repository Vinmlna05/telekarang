import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock, Info, MapPin, RotateCcw, Search, ShieldCheck, Stethoscope, Wifi } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { jadwalDokter, spesialisasiFilters, urutanHari, type Spesialisasi, type StatusJadwal } from '@/data/jadwal-dokter';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const hariFilters = ['Semua', ...urutanHari];

const statusMeta: Record<StatusJadwal, { label: string; tone: string; dot: string }> = {
    tersedia: {
        label: 'Tersedia',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
        dot: 'bg-tk-green-500 dark:bg-tk-accent',
    },
    terisi: {
        label: 'Slot penuh',
        tone: 'bg-tk-warning/15 text-tk-warning',
        dot: 'bg-tk-warning',
    },
    libur: {
        label: 'Libur',
        tone: 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
        dot: 'bg-[var(--tk-muted)]',
    },
};

const langkahKonsultasi = [
    'Pilih dokter spesialis dan slot jadwal yang tersedia.',
    'Datang ke Puskesmas Pulau Karang untuk skrining perawat.',
    'Dokter umum mereview hasil skrining sebelum diteruskan.',
    'Dokter spesialis mengonfirmasi jadwal konsultasi Anda.',
];

function inisial(nama: string): string {
    return (
        nama
            .replace(/^dr\.?\s+/i, '')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((bagian) => bagian.charAt(0).toUpperCase())
            .join('') || 'DR'
    );
}

export default function JadwalPasien() {
    const [q, setQ] = useState('');
    const [filterSpesialisasi, setFilterSpesialisasi] = useState<Spesialisasi | 'Semua'>('Semua');
    const [filterHari, setFilterHari] = useState('Semua');

    const dokterTersaring = jadwalDokter.filter((dokter) => {
        const kataKunci = q.trim().toLowerCase();
        const cocokKata =
            kataKunci === '' || [dokter.nama, dokter.spesialisasi, dokter.faskes].some((nilai) => nilai.toLowerCase().includes(kataKunci));
        const cocokSpesialisasi = filterSpesialisasi === 'Semua' || dokter.spesialisasi === filterSpesialisasi;
        const cocokHari = filterHari === 'Semua' || dokter.hari.includes(filterHari);

        return cocokKata && cocokSpesialisasi && cocokHari;
    });

    const jumlahSlot = dokterTersaring.reduce((total, dokter) => total + dokter.slots.length, 0);
    const filterAktif = q !== '' || filterSpesialisasi !== 'Semua' || filterHari !== 'Semua';
    const jadwalTerdekat = jadwalDokter
        .filter((dokter) => dokter.status === 'tersedia')
        .sort((a, b) => urutanHari.indexOf(a.hariTerdekat) - urutanHari.indexOf(b.hariTerdekat))
        .slice(0, 3);

    const resetFilter = () => {
        setQ('');
        setFilterSpesialisasi('Semua');
        setFilterHari('Semua');
    };

    return (
        <PasienAppLayout
            active="jadwal"
            title="Jadwal dokter spesialis"
            description="Temukan jadwal praktik dokter spesialis, pilih slot yang tersedia, lalu ajukan konsultasi tanpa harus naik kapal."
        >
            <Head title="Jadwal dokter spesialis" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-label="Cari dan filter jadwal" className={cn('rounded-[24px] p-4 lg:p-5', glass)}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                                <Input
                                    type="search"
                                    value={q}
                                    onChange={(event) => setQ(event.target.value)}
                                    placeholder="Cari dokter, spesialisasi, atau faskes..."
                                    aria-label="Cari dokter spesialis"
                                    className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                                />
                            </div>

                            {filterAktif && (
                                <button
                                    type="button"
                                    onClick={resetFilter}
                                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[12px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                >
                                    <RotateCcw className="size-3.5" aria-hidden="true" />
                                    Reset filter
                                </button>
                            )}
                        </div>

                        <div className="mt-4 space-y-2.5">
                            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <span className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                                    Spesialisasi
                                </span>
                                {spesialisasiFilters.map((item) => {
                                    const isActive = filterSpesialisasi === item;

                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            aria-pressed={isActive}
                                            onClick={() => setFilterSpesialisasi(item)}
                                            className={cn(
                                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                                isActive
                                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                            )}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <span className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Hari</span>
                                {hariFilters.map((item) => {
                                    const isActive = filterHari === item;

                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            aria-pressed={isActive}
                                            onClick={() => setFilterHari(item)}
                                            className={cn(
                                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                                isActive
                                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                            )}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="daftar-jadwal">
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h2 id="daftar-jadwal" className="text-[17px] font-bold">
                                    Jadwal praktik pekan ini
                                </h2>
                                <p aria-live="polite" className="mt-0.5 text-[12px] text-[var(--tk-muted)]">
                                    {dokterTersaring.length} dokter ditemukan · {jumlahSlot} slot tersedia
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                <CalendarDays className="size-3.5" aria-hidden="true" />
                                Waktu Indonesia Timur
                            </span>
                        </div>

                        {dokterTersaring.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {dokterTersaring.map((dokter) => {
                                    const status = statusMeta[dokter.status];
                                    const tersedia = dokter.status === 'tersedia' && dokter.slots.length > 0;

                                    return (
                                        <article key={dokter.id} className={cn('flex flex-col rounded-[24px] p-5', glass)}>
                                            <div className="flex items-start gap-3">
                                                <span className="text-tk-mint grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[12px] font-extrabold">
                                                    {inisial(dokter.nama)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold">{dokter.nama}</p>
                                                    <p className="text-tk-green-500 dark:text-tk-accent mt-0.5 text-[11px] font-semibold">
                                                        Spesialis {dokter.spesialisasi}
                                                    </p>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold',
                                                        status.tone,
                                                    )}
                                                >
                                                    <span className={cn('size-1.5 rounded-full', status.dot)} aria-hidden="true" />
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-2 text-[11px] text-[var(--tk-muted)]">
                                                <p className="flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                                    {dokter.faskes}
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                                                    {dokter.hari.join(' & ')} · {dokter.jam}
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                                                    {tersedia
                                                        ? `Slot terdekat ${dokter.hariTerdekat}, ${dokter.slotTerdekat}`
                                                        : dokter.status === 'terisi'
                                                          ? 'Semua slot pekan ini sudah terisi'
                                                          : 'Dokter sedang libur pekan ini'}
                                                </p>
                                            </div>

                                            <div className="mt-auto pt-4">
                                                {tersedia ? (
                                                    <div>
                                                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                                                            Pilih slot
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {dokter.slots.map((slot) => (
                                                                <Link
                                                                    key={slot}
                                                                    href={`/pasien/konsultasi/baru?dokter=${dokter.id}&jadwal=${encodeURIComponent(slot)}`}
                                                                    aria-label={`Pilih slot ${slot} bersama ${dokter.nama}`}
                                                                    className="border-tk-green-500/30 hover:bg-tk-accent hover:text-tk-deep inline-flex min-h-9 items-center rounded-full border bg-[var(--tk-page-alt)] px-3 text-[11px] font-semibold transition-colors"
                                                                >
                                                                    {slot}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                                        {dokter.status === 'terisi'
                                                            ? 'Coba pilih dokter lain dengan spesialisasi yang sama.'
                                                            : 'Jadwal dibuka kembali pekan depan. Pantau pusat notifikasi untuk perubahan.'}
                                                    </p>
                                                )}

                                                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--tk-glass-border)] pt-3">
                                                    <span className="text-[10px] font-semibold text-[var(--tk-muted)]">
                                                        {tersedia ? `${dokter.slots.length} slot tersedia` : 'Belum ada slot'}
                                                    </span>
                                                    {tersedia ? (
                                                        <Link
                                                            href={`/pasien/konsultasi/baru?dokter=${dokter.id}&jadwal=${encodeURIComponent(dokter.slotTerdekat)}`}
                                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 text-[11px] font-bold transition-colors"
                                                        >
                                                            Pilih jadwal
                                                            <ChevronRight className="size-3.5" aria-hidden="true" />
                                                        </Link>
                                                    ) : (
                                                        <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-2 text-[10px] font-semibold text-[var(--tk-muted)]">
                                                            Tidak tersedia
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={cn('grid place-items-center rounded-[24px] px-6 py-14 text-center', glass)}>
                                <span className="grid size-12 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                                    <CalendarDays className="size-5" aria-hidden="true" />
                                </span>
                                <p className="mt-3 text-sm font-bold">Jadwal tidak ditemukan</p>
                                <p className="mt-1 max-w-sm text-[12px] text-[var(--tk-muted)]">
                                    Coba ubah kata kunci, spesialisasi, atau hari yang dipilih.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilter}
                                    className="border-tk-green-500/35 text-tk-green-500 dark:text-tk-accent mt-4 min-h-10 rounded-full border px-4 text-[12px] font-semibold"
                                >
                                    Tampilkan semua jadwal
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="grid content-start gap-5">
                    <section aria-label="Ajakan membuat permintaan" className={cn('relative overflow-hidden rounded-[24px] p-6', bannerGradient)}>
                        <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/20 blur-xl" />
                        <div className="relative">
                            <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Konsultasi terarah</p>
                            <p className="text-tk-deep mt-1 max-w-[30ch] text-xl leading-tight font-extrabold">
                                Pilih dokter, perawat siapkan skrining.
                            </p>
                            <p className="text-tk-deep/75 mt-1.5 max-w-[44ch] text-xs">
                                Tidak perlu memprediksi jadwal spesialis dari daratan. Semua slot tersedia terlihat di sini.
                            </p>
                            <Link
                                href="/pasien/konsultasi/baru"
                                className="bg-tk-deep text-tk-mint mt-4 inline-flex min-h-10 items-center gap-1 rounded-full px-5 text-xs font-semibold"
                            >
                                Buat permintaan
                                <ChevronRight className="size-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </section>

                    <section aria-labelledby="slot-terdekat" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-2">
                            <h2 id="slot-terdekat" className="text-[15px] font-bold">
                                Slot terdekat
                            </h2>
                            <Clock className="text-tk-green-500 dark:text-tk-accent size-4" aria-hidden="true" />
                        </div>

                        <ul className="mt-3 divide-y divide-[var(--tk-glass-border)]">
                            {jadwalTerdekat.map((dokter) => (
                                <li key={dokter.id}>
                                    <Link
                                        href={`/pasien/konsultasi/baru?dokter=${dokter.id}&jadwal=${encodeURIComponent(dokter.slotTerdekat)}`}
                                        className="hover:text-tk-green-500 dark:hover:text-tk-accent flex min-h-16 items-center gap-3 py-3"
                                    >
                                        <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid w-12 shrink-0 place-items-center rounded-xl py-1.5">
                                            <span className="text-[9px] font-bold uppercase">{dokter.hariTerdekat}</span>
                                            <span className="text-sm leading-tight font-extrabold">{dokter.slotTerdekat}</span>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[12px] font-bold">{dokter.nama}</p>
                                            <p className="truncate text-[10px] text-[var(--tk-muted)]">
                                                {dokter.spesialisasi} · {dokter.faskes}
                                            </p>
                                        </div>
                                        <ChevronRight className="size-4 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section aria-labelledby="cara-konsultasi" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="cara-konsultasi" className="flex items-center gap-2 text-[15px] font-bold">
                            <ShieldCheck className="text-tk-green-500 dark:text-tk-accent size-4" aria-hidden="true" />
                            Cara membuat permintaan
                        </h2>

                        <ol className="mt-4 grid gap-3">
                            {langkahKonsultasi.map((langkah, index) => (
                                <li key={langkah} className="flex items-start gap-2.5">
                                    <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                                        {index + 1}
                                    </span>
                                    <p className="text-[11px] leading-relaxed text-[var(--tk-muted)]">{langkah}</p>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-4 flex items-start gap-2 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <CheckCircle2 className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            Permintaan hanya diteruskan ke spesialis setelah skrining perawat lengkap.
                        </p>
                    </section>

                    <section aria-label="Informasi jadwal dan koneksi" className="grid gap-3">
                        <div className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                            <span className="text-tk-info bg-tk-info/15 grid size-9 shrink-0 place-items-center rounded-full">
                                <Info className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-bold">Jadwal dapat berubah</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Jika dokter menjadwal ulang, Anda dan perawat akan menerima notifikasi untuk memilih slot baru.
                                </p>
                            </div>
                        </div>

                        <div className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                            <span className="text-tk-warning bg-tk-warning/15 grid size-9 shrink-0 place-items-center rounded-full">
                                <Wifi className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-bold">Sinyal lemah?</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Konsultasi tetap bisa berjalan lewat teks dan foto. Halaman jadwal ringan dan dapat dibuka ulang saat sinyal
                                    kembali.
                                </p>
                            </div>
                        </div>
                    </section>

                    <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-[var(--tk-muted)]">
                        <Stethoscope className="size-3.5" aria-hidden="true" />
                        Seluruh nama dokter dan jadwal pada prototipe ini adalah fiktif.
                    </p>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
