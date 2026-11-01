import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Clock, LayoutGrid, MessageSquare, UserRound, Video, Wifi } from 'lucide-react';
import { useState } from 'react';

import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';

type Prioritas = 'merah' | 'kuning' | 'normal';
type Mode = 'video' | 'teks';

interface PermintaanItem {
    id: number;
    nama: string;
    usia: number;
    jadwal: string;
    keluhan: string;
    prioritas: Prioritas;
    status: string;
    diminta: string;
}

interface JadwalSlot {
    id: number;
    jam: string;
    nama: string | null;
    status: 'tersedia' | 'terisi' | 'libur';
    mode: Mode | null;
}

interface KonsultasiBerlangsung {
    id: number;
    nama: string;
    mode: Mode;
    mulai: string;
    pesanTerakhir: string;
    pesanBaru: number;
}

interface BerandaSpesialisProps {
    ringkasan: {
        permintaanBaru: number;
        jadwalHariIni: number;
        selesaiBulanIni: number;
        video: number;
        teks: number;
    };
    permintaan: PermintaanItem[];
    jadwal: JadwalSlot[];
    berlangsung: KonsultasiBerlangsung[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const prioritasMeta: Record<Prioritas, { label: string; tone: string }> = {
    merah: { label: 'Prioritas tinggi', tone: 'bg-tk-danger/15 text-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning' },
    normal: { label: 'Normal', tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent' },
};

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function SectionHeading({ title, href, action }: { title: string; href?: string; action?: string }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold">{title}</h2>
            {href && action && (
                <Link href={href} className="text-tk-green-500 dark:text-tk-accent inline-flex items-center gap-0.5 text-xs font-semibold">
                    {action}
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

export default function BerandaSpesialis({ ringkasan, permintaan, jadwal, berlangsung }: BerandaSpesialisProps) {
    const [showMore, setShowMore] = useState(false);

    const konsultasiAktif = berlangsung[0] ?? null;
    const jadwalTerisi = jadwal.find((slot) => slot.status === 'terisi') ?? null;
    const totalMode = ringkasan.video + ringkasan.teks;
    const persenVideo = totalMode > 0 ? Math.round((ringkasan.video / totalMode) * 100) : 0;

    const quickActions = [
        { label: 'Permintaan', href: '/spesialis/permintaan', icon: ClipboardList },
        { label: 'Jadwal', href: '/spesialis/jadwal', icon: CalendarDays },
        {
            label: 'Konsultasi',
            href: konsultasiAktif ? `/spesialis/konsultasi/${konsultasiAktif.id}` : '/spesialis/permintaan',
            icon: MessageSquare,
        },
    ];

    return (
        <SpesialisAppLayout
            active="beranda"
            title="Beranda spesialis"
            description="Kelola permintaan konsultasi, jadwal praktik, dan konsultasi yang sedang berlangsung."
        >
            <Head title="Dasbor dokter spesialis" />

            <section aria-label="Ringkasan praktik" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    aria-labelledby="ringkasan-utama"
                    className={cn(
                        'relative overflow-hidden rounded-[22px] p-5 shadow-[0_18px_45px_rgba(4,16,14,0.10)] sm:col-span-2 xl:col-span-1',
                        glass,
                    )}
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(124,199,127,0.28),transparent_65%)]"
                    />
                    <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p id="ringkasan-utama" className="text-[11px] font-semibold tracking-[0.14em] text-[var(--tk-muted)] uppercase">
                                    Permintaan baru
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--tk-muted)]">Diteruskan dokter umum</p>
                            </div>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <ClipboardList className="size-4" aria-hidden="true" />
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-end gap-2">
                            <p className="text-[42px] leading-none font-semibold tracking-[-0.03em]">{ringkasan.permintaanBaru}</p>
                            <span className="bg-tk-warning/15 text-tk-warning mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                <Clock className="size-3" aria-hidden="true" />
                                dijawab ±30 menit
                            </span>
                        </div>

                        <p className="mt-1 text-[11px] text-[var(--tk-muted)]">menunggu konfirmasi jadwal</p>
                    </div>
                </article>

                <Link href="/spesialis/jadwal" className={cn('hover:border-tk-green-500/40 rounded-[22px] p-5 transition-colors', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Jadwal hari ini</p>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.jadwalHariIni}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">slot praktik</p>
                </Link>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Konsultasi selesai</p>
                    <p className="text-tk-green-500 dark:text-tk-accent mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">
                        {ringkasan.selesaiBulanIni}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">bulan ini</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Mode konsultasi</p>
                        <span className="text-[10px] font-semibold text-[var(--tk-muted)]">{totalMode} total</span>
                    </div>
                    <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--tk-page-alt)]" aria-hidden="true">
                        <span className="bg-tk-green-500 dark:bg-tk-accent block h-full" style={{ width: `${persenVideo}%` }} />
                        <span className="bg-tk-teal-700 dark:bg-tk-mint block h-full" style={{ width: `${100 - persenVideo}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                        <span>Video {ringkasan.video}</span>
                        <span className="text-[var(--tk-muted)]">Teks {ringkasan.teks}</span>
                    </div>
                </article>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-6">
                    <section aria-labelledby="permintaan-baru">
                        <SectionHeading title="Permintaan masuk" href="/spesialis/permintaan" action="Lihat semua" />

                        <div className="grid gap-3">
                            {permintaan.map((item) => {
                                const prioritas = prioritasMeta[item.prioritas];

                                return (
                                    <article key={item.id} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                                            <div className="flex min-w-0 items-center gap-3 xl:w-[30%]">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold">
                                                    {initials(item.nama)}
                                                </span>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="truncate text-sm font-bold">{item.nama}</p>
                                                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', prioritas.tone)}>
                                                            {prioritas.label}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                                        {item.usia} tahun · {item.jadwal} · diminta {item.diminta}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="min-w-0 flex-1 text-xs leading-relaxed text-[var(--tk-muted)] xl:border-l xl:border-[var(--tk-glass-border)] xl:pl-5">
                                                {item.keluhan}
                                            </p>

                                            <div className="flex shrink-0 items-center justify-between gap-3 xl:justify-end">
                                                <Link
                                                    href={`/spesialis/konsultasi/${item.id}`}
                                                    className="min-h-9 text-[11px] font-semibold text-[var(--tk-muted)] underline-offset-4 hover:underline"
                                                >
                                                    Lihat detail
                                                </Link>
                                                <Link
                                                    href={`/spesialis/konsultasi/${item.id}`}
                                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 items-center gap-1 rounded-full px-4 text-xs font-semibold transition-colors"
                                                >
                                                    Konfirmasi jadwal
                                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section aria-labelledby="jadwal-hari-ini">
                        <SectionHeading title="Jadwal praktik hari ini" href="/spesialis/jadwal" action="Kelola jadwal" />

                        <div className={cn('overflow-hidden rounded-[20px]', glass)}>
                            <div className="hidden grid-cols-[70px_minmax(0,1fr)_100px_40px] gap-3 border-b border-[var(--tk-glass-border)] px-4 py-3 text-[10px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase sm:grid">
                                <span>Jam</span>
                                <span>Pasien dan mode</span>
                                <span>Status</span>
                                <span className="sr-only">Aksi</span>
                            </div>

                            <div className="divide-y divide-[var(--tk-glass-border)] px-4">
                                {jadwal.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className="flex items-center gap-3 py-3 sm:grid sm:grid-cols-[70px_minmax(0,1fr)_100px_40px] sm:gap-3"
                                    >
                                        <span className="grid min-h-10 w-14 shrink-0 place-items-center rounded-xl bg-[var(--tk-page-alt)] text-xs font-bold">
                                            {slot.jam}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold">{slot.nama ?? 'Slot tersedia'}</p>
                                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                                {slot.status === 'tersedia' ? (
                                                    'Belum ada pasien'
                                                ) : slot.mode === 'teks' ? (
                                                    <>
                                                        <MessageSquare className="size-3" aria-hidden="true" />
                                                        Mode teks
                                                    </>
                                                ) : (
                                                    <>
                                                        <Video className="size-3" aria-hidden="true" />
                                                        Mode video
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        <span
                                            className={cn(
                                                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                slot.status === 'tersedia'
                                                    ? 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent'
                                                    : 'bg-tk-info/15 text-tk-info',
                                            )}
                                        >
                                            {slot.status === 'tersedia' ? 'Tersedia' : 'Terisi'}
                                        </span>

                                        <Link
                                            href={slot.status === 'tersedia' ? '/spesialis/jadwal' : `/spesialis/konsultasi/${slot.id}`}
                                            aria-label={slot.status === 'tersedia' ? 'Kelola slot jadwal' : `Buka konsultasi ${slot.nama}`}
                                            className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                                        >
                                            <ChevronRight className="size-4" aria-hidden="true" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="grid content-start gap-5">
                    {jadwalTerisi && (
                        <section aria-label="Konsultasi berikutnya">
                            <div className={cn('relative overflow-hidden rounded-[24px] p-5', bannerGradient)}>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-10 -right-6 size-32 rounded-full bg-white/20 blur-xl"
                                />
                                <div className="relative">
                                    <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Konsultasi berikutnya</p>
                                    <p className="text-tk-deep mt-1 text-lg leading-tight font-extrabold">
                                        {jadwalTerisi.jam} WITA · {jadwalTerisi.nama}
                                    </p>
                                    <span className="text-tk-deep mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-semibold">
                                        {jadwalTerisi.mode === 'teks' ? (
                                            <MessageSquare className="size-3" aria-hidden="true" />
                                        ) : (
                                            <Video className="size-3" aria-hidden="true" />
                                        )}
                                        {jadwalTerisi.mode === 'teks' ? 'Mode teks · sinyal lemah' : 'Mode video'}
                                    </span>
                                    <p className="text-tk-deep/75 mt-2 text-xs leading-relaxed">
                                        Data skrining sudah lengkap. Buka ruang konsultasi saat pasien dan perawat siap.
                                    </p>
                                    <Link
                                        href={`/spesialis/konsultasi/${jadwalTerisi.id}`}
                                        className="bg-tk-deep text-tk-mint mt-4 inline-flex min-h-10 items-center gap-1 rounded-full px-4 text-xs font-semibold"
                                    >
                                        Buka ruang konsultasi
                                        <ChevronRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {konsultasiAktif && (
                        <section aria-labelledby="konsultasi-berlangsung" className={cn('rounded-[24px] p-5', glass)}>
                            <div className="flex items-center justify-between gap-2">
                                <h2 id="konsultasi-berlangsung" className="text-[15px] font-bold">
                                    Konsultasi berlangsung
                                </h2>
                                <span className="bg-tk-info/15 text-tk-info rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                    Mode {konsultasiAktif.mode === 'teks' ? 'teks' : 'video'}
                                </span>
                            </div>

                            <div className="mt-3 flex items-start gap-3">
                                <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                    <MessageSquare className="size-5" aria-hidden="true" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold">{konsultasiAktif.nama}</p>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Dimulai {konsultasiAktif.mulai} WITA</p>
                                    <p className="mt-2 rounded-xl bg-[var(--tk-page-alt)] px-3 py-2 text-xs text-[var(--tk-muted)]">
                                        “{konsultasiAktif.pesanTerakhir}”
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-tk-warning inline-flex items-center gap-1 text-[10px] font-semibold">
                                            <span className="bg-tk-warning size-1.5 rounded-full" aria-hidden="true" />
                                            {konsultasiAktif.pesanBaru} pesan baru
                                        </span>
                                        <Link
                                            href={`/spesialis/konsultasi/${konsultasiAktif.id}`}
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors"
                                        >
                                            Lanjutkan
                                            <ChevronRight className="size-3.5" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <section aria-labelledby="aksi-cepat" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="aksi-cepat" className="text-[15px] font-bold">
                            Aksi cepat
                        </h2>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {quickActions.map(({ label, href, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="flex min-h-20 flex-col justify-center gap-2 rounded-2xl px-3 py-3 hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="border-tk-green-500/35 text-tk-green-500 dark:border-tk-accent/40 dark:text-tk-accent grid size-10 place-items-center rounded-full border-[1.5px]">
                                        <Icon className="size-5" aria-hidden="true" />
                                    </span>
                                    <span className="text-[11px] leading-tight font-semibold text-[var(--tk-text)]">{label}</span>
                                </Link>
                            ))}

                            <button
                                type="button"
                                onClick={() => setShowMore((value) => !value)}
                                aria-expanded={showMore}
                                className="flex min-h-20 flex-col justify-center gap-2 rounded-2xl px-3 py-3 text-left hover:bg-[var(--tk-page-alt)]"
                            >
                                <span className="border-tk-green-500/35 text-tk-green-500 dark:border-tk-accent/40 dark:text-tk-accent grid size-10 place-items-center rounded-full border-[1.5px]">
                                    <LayoutGrid className="size-5" aria-hidden="true" />
                                </span>
                                <span className="text-[11px] leading-tight font-semibold text-[var(--tk-text)]">Lainnya</span>
                            </button>
                        </div>

                        {showMore && (
                            <div className="mt-3 grid gap-1 border-t border-[var(--tk-glass-border)] pt-3 text-sm">
                                <Link href="/spesialis/hasil/7" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Isi hasil konsultasi
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                                <Link href="/spesialis/jadwal" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Atur jadwal praktik
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                                <Link href="/settings/profile" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Pengaturan akun
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </section>

                    <section className={cn('rounded-[20px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="text-tk-warning bg-tk-warning/15 grid size-9 shrink-0 place-items-center rounded-full">
                                <Wifi className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-bold">Mode mengikuti kualitas koneksi</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Saat sinyal lemah, konsultasi beralih ke teks dan foto terkompres. Alasan peralihan selalu tampil di layar.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-1.5 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] text-[var(--tk-muted)]">
                            <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3" aria-hidden="true" />
                                Hasil wajib memuat ICD-10 dan keputusan rujuk
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <UserRound className="size-3" aria-hidden="true" />
                                Data pada prototipe ini fiktif
                            </span>
                        </div>
                    </section>
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
