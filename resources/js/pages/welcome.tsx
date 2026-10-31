import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Bell, CalendarDays, ClipboardList, FileText, LayoutGrid, MessageSquare, Users, Wifi } from 'lucide-react';

import TelekarangBrand from '@/components/telekarang-brand';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
    { label: 'Masalah', href: '#masalah' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Alur', href: '#alur' },
    { label: 'Sinyal lemah', href: '#koneksi' },
];

const phoneActions = [
    { label: 'Skrining', icon: ClipboardList },
    { label: 'Pasien', icon: Users },
    { label: 'Jadwal', icon: CalendarDays },
    { label: 'Lainnya', icon: LayoutGrid },
];

const stats = [
    { value: '3 jam', body: 'perjalanan kapal sekali jalan ke RS rujukan, belum termasuk biaya tiket.' },
    { value: '4 dari 10', body: 'rujukan sebenarnya bisa selesai lewat konsultasi jarak jauh.' },
    { value: 'Tidak tahu', body: 'jadwal dokter spesialis RS, sehingga puskesmas sulit mengatur konsultasi.' },
];

const features: { icon: LucideIcon; title: string; body: string }[] = [
    {
        icon: CalendarDays,
        title: 'Lihat jadwal dan daftar konsultasi',
        body: 'Jadwal spesialis tampil per spesialisasi. Perawat atau pasien bisa memilih slot yang masih kosong.',
    },
    {
        icon: MessageSquare,
        title: 'Konsultasi lewat video atau teks',
        body: 'Status konsultasi terlihat dari menunggu sampai selesai, dan spesialis bisa menerima, menjadwal ulang, atau menolak.',
    },
    {
        icon: FileText,
        title: 'Catat hasil dan keputusan rujuk',
        body: 'Diagnosis dipilih dari daftar ICD-10, lengkap dengan saran dan keputusan rujuk atau tidak.',
    },
    {
        icon: Wifi,
        title: 'Tetap jalan saat sinyal lemah',
        body: 'Aplikasi beralih ke mode teks dan foto, lalu menjelaskan alasannya di layar.',
    },
];

const steps = [
    {
        title: 'Pasien datang atau mengirim keluhan.',
        body: 'Pasien dengan akun bisa membuat permintaan dari rumah. Tanpa akun, perawat yang mendaftarkan.',
    },
    {
        title: 'Perawat melakukan skrining.',
        body: 'Berat, tinggi, tensi, suhu, nadi, dan saturasi oksigen dicatat. Tanda bahaya langsung diberi peringatan.',
    },
    { title: 'Dokter umum meninjau.', body: 'Perlu spesialis atau cukup ditangani di puskesmas.' },
    {
        title: 'Spesialis mengonfirmasi dan berkonsultasi.',
        body: 'Mode video atau teks dipilih sesuai kualitas sinyal.',
    },
    {
        title: 'Hasil dicatat.',
        body: 'Diagnosis ICD-10, saran, dan keputusan rujuk masuk ke dasbor rujukan terhindarkan.',
    },
];

const roles = [
    { title: 'Perawat', body: 'Skrining, daftar pasien, tindak lanjut hasil.' },
    { title: 'Dokter umum', body: 'Meninjau skrining dan memutuskan perlu spesialis.' },
    { title: 'Dokter spesialis', body: 'Mengatur jadwal, berkonsultasi, mengisi hasil.' },
    { title: 'Pasien', body: 'Melihat jadwal, mengirim keluhan, memantau hasil.' },
    { title: 'Admin', body: 'Mengelola pengguna, data dokter, dan ICD-10.' },
];

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const container = 'mx-auto w-full max-w-[1120px] px-5';

const heroGradient = 'bg-[linear-gradient(160deg,#04100E_0%,#0A2A27_38%,#2E8B6A_100%)]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

function PhoneMockup() {
    return (
        <div
            role="img"
            aria-label="Contoh tampilan beranda perawat TeleKarang"
            className="mx-auto w-full max-w-[330px] rounded-[38px] border border-white/[0.18] bg-[linear-gradient(170deg,#04100E_0%,#0A2A27_45%,#2E8B6A_130%)] px-4 pt-5 pb-3.5 text-white shadow-[0_30px_70px_rgba(0,0,0,0.45)]"
        >
            <div className="flex items-center gap-2.5">
                <span className="border-tk-accent bg-tk-teal-700 grid size-[38px] place-items-center rounded-full border-2 font-bold">S</span>
                <span className="flex-1 text-[15px] font-bold">Hai, Perawat Sari</span>
                <span className="grid size-9 place-items-center rounded-full bg-white/[0.12]">
                    <Bell className="size-[18px]" aria-hidden="true" />
                </span>
            </div>

            <p className="mt-4 text-[11px] text-white/70">Rujukan terhindarkan bulan ini</p>
            <p className="text-[36px] leading-[1.1] font-semibold tracking-[-0.02em]">
                38 <small className="text-xs font-medium tracking-normal text-white/70">dari 95 rujukan</small>
            </p>
            <p className="text-tk-accent text-xs font-semibold">+40%</p>

            <div className="mx-[-4px] mt-3.5 rounded-[26px] border border-white/[0.12] bg-white/[0.06] px-3 pt-3.5 pb-3">
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    {phoneActions.map(({ label, icon: Icon }) => (
                        <span key={label} className="grid justify-items-center gap-1.5">
                            <i className="grid size-[46px] place-items-center rounded-full border-[1.5px] border-white/[0.55]">
                                <Icon className="size-5" aria-hidden="true" />
                            </i>
                            {label}
                        </span>
                    ))}
                </div>

                <div className={cn('mt-3.5 grid justify-items-start gap-2.5 rounded-2xl p-3.5', bannerGradient)}>
                    <b className="max-w-[18ch] text-sm leading-tight">Konsultasi spesialis tanpa naik kapal</b>
                    <span className="bg-tk-deep/[0.35] rounded-full border border-white/40 px-3 py-1 text-[10px] font-semibold">
                        Mulai konsultasi
                    </span>
                </div>

                <p className="mt-3.5 text-xs font-semibold">Spesialis tersedia hari ini</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="grid gap-0.5 rounded-[14px] bg-white/[0.08] p-1.5 text-[10px]">
                        <span className="h-[54px] rounded-[10px] bg-[linear-gradient(135deg,#1F6F57,#9FE3B5)]" />
                        <em className="px-1 pt-0.5 font-semibold not-italic">Spesialis anak</em>
                        <b className="text-tk-accent px-1 pb-0.5 font-semibold">Slot 10.00</b>
                    </div>
                    <div className="grid gap-0.5 rounded-[14px] bg-white/[0.08] p-1.5 text-[10px]">
                        <span className="h-[54px] rounded-[10px] bg-[linear-gradient(135deg,#0F4A40,#4FBF8F)]" />
                        <em className="px-1 pt-0.5 font-semibold not-italic">Penyakit dalam</em>
                        <b className="text-tk-accent px-1 pb-0.5 font-semibold">Slot 13.30</b>
                    </div>
                </div>
            </div>

            <nav aria-hidden="true" className="mt-3 grid grid-cols-4 border-t border-white/[0.12] pt-2.5 text-center text-[10px] text-white/60">
                <span className="text-tk-accent font-bold">Beranda</span>
                <span>Antrean</span>
                <span>Pasien</span>
                <span>Profil</span>
            </nav>
        </div>
    );
}

export default function Welcome() {
    return (
        <div className="min-h-screen bg-[var(--tk-page)] font-sans text-[var(--tk-text)]">
            <Head title="TeleKarang: konsultasi spesialis untuk Pulau Karang">
                <meta
                    name="description"
                    content="TeleKarang menghubungkan puskesmas pulau dengan dokter spesialis RS lewat konsultasi jarak jauh, termasuk saat sinyal lemah."
                />
            </Head>

            <a
                href="#fitur"
                className="focus:bg-tk-accent focus:text-tk-deep sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold"
            >
                Lewati ke konten
            </a>

            {/* Hero */}
            <div className={cn('relative overflow-hidden rounded-b-[28px] pb-16 text-white md:pb-[72px]', heroGradient)}>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(180deg,#000_0%,transparent_70%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-[20%] -right-[10%] aspect-square w-[60%] bg-[radial-gradient(circle,rgba(124,199,127,0.35),transparent_65%)]"
                />

                <header className={cn(container, 'relative z-10 flex items-center justify-between gap-4 py-5')}>
                    <a href="#" aria-label="TeleKarang">
                        <TelekarangBrand />
                    </a>

                    <nav aria-label="Utama" className="hidden items-center gap-7 text-[15px] text-white/80 md:flex">
                        {navLinks.map((link) => (
                            <a key={link.href} href={link.href} className="transition-colors hover:text-white">
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />
                        <Button
                            asChild
                            variant="ghost"
                            className="h-11 rounded-full border border-white/[0.28] bg-white/[0.08] px-5 text-[15px] font-semibold text-white hover:bg-white/[0.16] hover:text-white"
                        >
                            <Link href={route('login')}>Masuk</Link>
                        </Button>
                    </div>
                </header>

                <section className={cn(container, 'relative z-10 grid items-center gap-10 pt-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12')}>
                    <div>
                        <h1 className="max-w-[14ch] text-[clamp(2.3rem,5.4vw,4rem)] leading-[1.05] font-extrabold tracking-[-0.02em]">
                            Dokter spesialis tanpa naik kapal tiga jam.
                        </h1>
                        <p className="mt-6 max-w-[52ch] text-lg text-white/[0.85]">
                            TeleKarang menghubungkan puskesmas pulau dengan dokter spesialis rumah sakit. Perawat skrining, spesialis menjawab, dan
                            pasien hanya dirujuk jika benar-benar perlu.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild className="bg-tk-accent text-tk-deep hover:bg-tk-mint h-12 rounded-full px-6 text-[15px] font-semibold">
                                <Link href={route('login')}>Masuk ke TeleKarang</Link>
                            </Button>
                            <Button
                                asChild
                                variant="ghost"
                                className="h-12 rounded-full border border-white/[0.28] bg-white/[0.08] px-6 text-[15px] font-semibold text-white hover:bg-white/[0.16] hover:text-white"
                            >
                                <a href="#alur">Lihat alurnya</a>
                            </Button>
                        </div>
                        <p className="mt-4 text-[13px] text-white/60">Data pada prototipe ini fiktif.</p>
                    </div>

                    <PhoneMockup />
                </section>
            </div>

            <main>
                {/* Masalah */}
                <section id="masalah" className="py-16 md:py-[88px]">
                    <div className={container}>
                        <h2 className="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-[-0.02em]">
                            Tiga hal yang membuat pasien pulau rugi waktu dan biaya
                        </h2>
                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            {stats.map((stat) => (
                                <article key={stat.value} className={cn('rounded-[20px] p-7', glass)}>
                                    <p className="text-tk-green-500 dark:text-tk-accent text-[clamp(2rem,4vw,2.8rem)] font-bold tracking-[-0.03em]">
                                        {stat.value}
                                    </p>
                                    <p className="mt-2 text-[var(--tk-muted)]">{stat.body}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Fitur */}
                <section id="fitur" className="bg-[var(--tk-page-alt)] py-16 md:py-[88px]">
                    <div className={container}>
                        <h2 className="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-[-0.02em]">
                            Empat hal yang bisa dilakukan di TeleKarang
                        </h2>
                        <div className="mt-10 grid gap-5 md:grid-cols-2">
                            {features.map(({ icon: Icon, title, body }) => (
                                <article key={title} className={cn('rounded-[20px] p-7 md:p-[30px]', glass)}>
                                    <span className={cn('text-tk-deep mb-4 grid size-[52px] place-items-center rounded-full', bannerGradient)}>
                                        <Icon className="size-6" aria-hidden="true" />
                                    </span>
                                    <h3 className="text-xl font-bold">{title}</h3>
                                    <p className="mt-2.5 max-w-[46ch] text-[var(--tk-muted)]">{body}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Alur */}
                <section id="alur" className="py-16 md:py-[88px]">
                    <div className={cn(container, 'grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14')}>
                        <div>
                            <h2 className="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-[-0.02em]">
                                Dari pasien datang sampai hasil tercatat
                            </h2>
                            <p className="mt-4 max-w-[44ch] text-[var(--tk-muted)]">
                                Skrining perawat selalu lebih dulu, jadi spesialis menerima data yang lengkap dan bisa dipercaya.
                            </p>
                        </div>

                        <ol className="grid gap-3.5">
                            {steps.map((step, index) => (
                                <li key={step.title} className={cn('relative rounded-[20px] py-5 pr-[22px] pl-[74px]', glass)}>
                                    <span className="bg-tk-accent text-tk-deep absolute top-5 left-5 grid size-9 place-items-center rounded-full font-bold">
                                        {index + 1}
                                    </span>
                                    <b className="block text-[1.05rem]">{step.title}</b>
                                    <span className="mt-1 block text-[var(--tk-muted)]">{step.body}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Koneksi */}
                <section id="koneksi" className="bg-[var(--tk-page-alt)] py-16 md:py-[88px]">
                    <div className={container}>
                        <div
                            className={cn(
                                'text-tk-deep grid items-center gap-10 rounded-[28px] p-6 md:grid-cols-[1.1fr_0.9fr] md:p-12',
                                bannerGradient,
                            )}
                        >
                            <div>
                                <h2 className="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-[-0.02em]">
                                    Sinyal lemah bukan alasan menunda konsultasi
                                </h2>
                                <p className="mt-4 max-w-[48ch] font-medium">
                                    TeleKarang mengecek kualitas koneksi sebelum konsultasi dimulai. Jika lemah, video dimatikan dan pesan teks serta
                                    foto terkompres tetap terkirim begitu sinyal kembali.
                                </p>
                            </div>

                            <div
                                role="img"
                                aria-label="Contoh peringatan mode koneksi rendah"
                                className="bg-tk-deep/[0.82] grid justify-items-start gap-3 rounded-[20px] border border-white/[0.18] p-[22px] text-white"
                            >
                                <span className="text-tk-warning inline-flex items-center gap-2 text-[13px] font-semibold">
                                    <i className="bg-tk-warning size-2.5 rounded-full shadow-[0_0_0_4px_rgba(242,184,75,0.25)]" />
                                    Sinyal lemah
                                </span>
                                <p className="text-[15px]">
                                    Sinyal lemah terdeteksi. Beralih ke mode teks agar konsultasi tetap berjalan tanpa terputus.
                                </p>
                                <span className="bg-tk-accent text-tk-deep rounded-full px-3.5 py-1.5 text-xs font-semibold">
                                    Mode teks dan foto aktif
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Peran */}
                <section className="py-16 md:py-[88px]">
                    <div className={container}>
                        <h2 className="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-[-0.02em]">
                            Dibuat untuk semua yang terlibat
                        </h2>
                        <ul className="mt-10 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
                            {roles.map((role) => (
                                <li key={role.title} className={cn('grid content-start gap-1.5 rounded-[20px] px-[18px] py-[22px]', glass)}>
                                    <b className="text-[1.05rem]">{role.title}</b>
                                    <span className="text-sm text-[var(--tk-muted)]">{role.body}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* CTA */}
                <section className="pt-6 pb-16 md:pb-[88px]">
                    <div className={container}>
                        <div className={cn('grid justify-items-center gap-3.5 rounded-[28px] px-6 py-16 text-center text-white', heroGradient)}>
                            <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-[-0.02em]">
                                Mulai dari satu konsultasi
                            </h2>
                            <p className="mb-2.5 text-white/80">Masuk sebagai perawat, dokter, atau pasien untuk mencoba alurnya.</p>
                            <Button asChild className="bg-tk-accent text-tk-deep hover:bg-tk-mint h-12 rounded-full px-6 text-[15px] font-semibold">
                                <Link href={route('login')}>Masuk ke TeleKarang</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[var(--tk-glass-border)] py-9 md:pb-12">
                <div className={cn(container, 'flex flex-wrap items-center justify-between gap-3')}>
                    <TelekarangBrand />
                    <p className="max-w-[60ch] text-sm text-[var(--tk-muted)]">
                        Prototipe studi kasus Puskesmas Pulau Karang. Seluruh data pasien dan dokter adalah fiktif.
                    </p>
                </div>
            </footer>
        </div>
    );
}
