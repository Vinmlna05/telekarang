import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Info,
    MessageSquare,
    Pencil,
    Plus,
    Power,
    PowerOff,
    ShieldCheck,
    Trash2,
    UserRound,
    Video,
    Wifi,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import {
    hariPraktik,
    jadwalSpesialisAwal,
    labelModeJadwal,
    type BlokJadwal,
    type HariPraktik,
    type ModeJadwal,
    type StatusBlokJadwal,
} from '@/data/jadwal-spesialis';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';

type FormErrors = Partial<Record<'jamMulai' | 'jamSelesai' | 'kuota' | 'bentrok' | 'umum', string>>;
type Pesan = { tone: 'sukses' | 'info'; teks: string };

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const selectClass =
    'focus-visible:ring-tk-accent h-11 w-full rounded-xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] focus:ring-2 focus:outline-hidden';
const modePilihan: ModeJadwal[] = ['video', 'teks', 'keduanya'];
const statusPilihan: StatusBlokJadwal[] = ['aktif', 'libur'];
const kunciJadwal = 'telekarang:jadwal-spesialis';

function toMenit(jam: string): number {
    const [jamBagian, menitBagian] = jam.split(':').map(Number);

    if (!Number.isFinite(jamBagian) || !Number.isFinite(menitBagian)) {
        return 0;
    }

    return jamBagian * 60 + menitBagian;
}

function formatJam(jam: string): string {
    return jam.replace(':', '.');
}

function isBlokJadwal(nilai: unknown): nilai is BlokJadwal {
    if (typeof nilai !== 'object' || nilai === null) {
        return false;
    }

    const item = nilai as Partial<BlokJadwal>;

    return (
        typeof item.id === 'number' &&
        typeof item.hari === 'string' &&
        (hariPraktik as string[]).includes(item.hari) &&
        typeof item.jamMulai === 'string' &&
        typeof item.jamSelesai === 'string' &&
        typeof item.kuota === 'number' &&
        typeof item.terisi === 'number' &&
        (item.mode === 'video' || item.mode === 'teks' || item.mode === 'keduanya') &&
        (item.status === 'aktif' || item.status === 'libur')
    );
}

function bacaJadwal(): BlokJadwal[] | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciJadwal);

        if (!mentah) {
            return null;
        }

        const parsed: unknown = JSON.parse(mentah);

        if (!Array.isArray(parsed)) {
            return null;
        }

        const valid = parsed.filter(isBlokJadwal);

        return valid.length > 0 ? valid : null;
    } catch {
        return null;
    }
}

function simpanJadwal(daftar: BlokJadwal[]): void {
    try {
        window.localStorage.setItem(kunciJadwal, JSON.stringify(daftar));
    } catch {
        // Penyimpanan lokal tidak tersedia; perubahan tetap berlaku pada sesi ini.
    }
}

function scrollKeForm(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.getElementById('form-jadwal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function JadwalSpesialis() {
    const [blok, setBlok] = useState<BlokJadwal[]>(() => bacaJadwal() ?? jadwalSpesialisAwal);
    const [editId, setEditId] = useState<number | null>(null);
    const [hari, setHari] = useState<HariPraktik>('Senin');
    const [jamMulai, setJamMulai] = useState('09:00');
    const [jamSelesai, setJamSelesai] = useState('12:00');
    const [kuota, setKuota] = useState('6');
    const [mode, setMode] = useState<ModeJadwal>('keduanya');
    const [status, setStatus] = useState<StatusBlokJadwal>('aktif');
    const [errors, setErrors] = useState<FormErrors>({});
    const [pesan, setPesan] = useState<Pesan | null>(null);

    const blokAktif = blok.filter((item) => item.status === 'aktif');
    const totalSlot = blokAktif.reduce((total, item) => total + item.kuota, 0);
    const slotTerisi = blokAktif.reduce((total, item) => total + Math.min(item.terisi, item.kuota), 0);
    const slotTersedia = Math.max(totalSlot - slotTerisi, 0);
    const hariAktif = new Set(blokAktif.map((item) => item.hari)).size;
    const persenTerisi = totalSlot > 0 ? Math.round((slotTerisi / totalSlot) * 100) : 0;
    const blokDiedit = editId === null ? null : (blok.find((item) => item.id === editId) ?? null);

    function terapkan(daftar: BlokJadwal[], teks: string, tone: Pesan['tone'] = 'sukses') {
        setBlok(daftar);
        simpanJadwal(daftar);
        setPesan({ tone, teks });
    }

    function resetForm() {
        setEditId(null);
        setHari('Senin');
        setJamMulai('09:00');
        setJamSelesai('12:00');
        setKuota('6');
        setMode('keduanya');
        setStatus('aktif');
        setErrors({});
    }

    function mulaiTambah(hariDipilih: HariPraktik = 'Senin') {
        resetForm();
        setHari(hariDipilih);
        scrollKeForm();
    }

    function mulaiEdit(item: BlokJadwal) {
        setEditId(item.id);
        setHari(item.hari);
        setJamMulai(item.jamMulai);
        setJamSelesai(item.jamSelesai);
        setKuota(String(item.kuota));
        setMode(item.mode);
        setStatus(item.status);
        setErrors({});
        scrollKeForm();
    }

    function simpanBlok(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};
        const mulai = toMenit(jamMulai);
        const selesai = toMenit(jamSelesai);
        const jumlahKuota = Number(kuota);

        if (!jamMulai) {
            nextErrors.jamMulai = 'Jam mulai wajib diisi.';
        }

        if (!jamSelesai) {
            nextErrors.jamSelesai = 'Jam selesai wajib diisi.';
        } else if (selesai <= mulai) {
            nextErrors.jamSelesai = 'Jam selesai harus lebih lambat dari jam mulai.';
        }

        if (!Number.isInteger(jumlahKuota) || jumlahKuota < 1 || jumlahKuota > 20) {
            nextErrors.kuota = 'Kuota harus bilangan bulat antara 1 dan 20.';
        } else if (status === 'aktif' && blokDiedit && jumlahKuota < blokDiedit.terisi) {
            nextErrors.kuota = `Kuota tidak boleh lebih kecil dari ${blokDiedit.terisi} slot yang sudah terisi.`;
        }

        const punyaBentrok =
            status === 'aktif' &&
            selesai > mulai &&
            blok.some(
                (item) =>
                    item.id !== editId &&
                    item.hari === hari &&
                    item.status === 'aktif' &&
                    mulai < toMenit(item.jamSelesai) &&
                    selesai > toMenit(item.jamMulai),
            );

        if (punyaBentrok) {
            nextErrors.bentrok = `Jadwal bertabrakan dengan blok lain pada hari ${hari}.`;
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        if (editId !== null) {
            const daftar = blok.map((item) =>
                item.id === editId
                    ? {
                          ...item,
                          hari,
                          jamMulai,
                          jamSelesai,
                          kuota: jumlahKuota,
                          mode,
                          status,
                          terisi: status === 'libur' ? 0 : item.terisi,
                      }
                    : item,
            );

            terapkan(daftar, `Jadwal ${hari}, ${formatJam(jamMulai)}–${formatJam(jamSelesai)} berhasil diperbarui.`);
        } else {
            const baru: BlokJadwal = {
                id: Date.now(),
                hari,
                jamMulai,
                jamSelesai,
                kuota: jumlahKuota,
                terisi: 0,
                mode,
                status,
            };

            terapkan([...blok, baru], `Jadwal ${hari}, ${formatJam(jamMulai)}–${formatJam(jamSelesai)} berhasil ditambahkan.`);
        }

        resetForm();
    }

    function ubahStatus(item: BlokJadwal, statusBaru: StatusBlokJadwal) {
        if (statusBaru === item.status) {
            return;
        }

        const daftar = blok.map((nilai) =>
            nilai.id === item.id ? { ...nilai, status: statusBaru, terisi: statusBaru === 'libur' ? 0 : nilai.terisi } : nilai,
        );

        terapkan(
            daftar,
            statusBaru === 'libur'
                ? `Jadwal ${item.hari} ${formatJam(item.jamMulai)}–${formatJam(item.jamSelesai)} diliburkan. Pasien yang sudah terdaftar akan dihubungi untuk penjadwalan ulang.`
                : `Jadwal ${item.hari} ${formatJam(item.jamMulai)}–${formatJam(item.jamSelesai)} diaktifkan kembali.`,
            statusBaru === 'libur' ? 'info' : 'sukses',
        );

        if (editId === item.id && statusBaru === 'libur') {
            setStatus('libur');
        }
    }

    function hapusBlok(item: BlokJadwal) {
        if (
            typeof window !== 'undefined' &&
            !window.confirm(`Hapus jadwal ${item.hari} ${formatJam(item.jamMulai)}–${formatJam(item.jamSelesai)}?`)
        ) {
            return;
        }

        terapkan(
            blok.filter((nilai) => nilai.id !== item.id),
            `Jadwal ${item.hari} ${formatJam(item.jamMulai)}–${formatJam(item.jamSelesai)} dihapus.`,
        );

        if (editId === item.id) {
            resetForm();
        }
    }

    return (
        <SpesialisAppLayout
            active="jadwal"
            title="Kelola jadwal praktik"
            description="Atur hari, jam, kuota, dan mode konsultasi agar perawat dan pasien tahu kapan Anda tersedia."
        >
            <Head title="Kelola jadwal praktik" />

            {pesan && (
                <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                        'mb-5 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[11px] leading-relaxed',
                        pesan.tone === 'sukses' ? 'border-tk-success/30 bg-tk-success/10' : 'border-tk-warning/30 bg-tk-warning/10',
                    )}
                >
                    <span className={cn('mt-0.5 shrink-0', pesan.tone === 'sukses' ? 'text-tk-success' : 'text-tk-warning')}>
                        {pesan.tone === 'sukses' ? (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                            <AlertTriangle className="size-4" aria-hidden="true" />
                        )}
                    </span>
                    <p className="text-[var(--tk-text)]">{pesan.teks}</p>
                </div>
            )}

            <section aria-label="Ringkasan jadwal" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    aria-labelledby="ringkasan-slot"
                    className={cn('relative overflow-hidden rounded-[22px] p-5 sm:col-span-2 xl:col-span-1', bannerGradient)}
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-white/25 blur-xl" />
                    <div className="relative">
                        <p id="ringkasan-slot" className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">
                            Slot tersedia
                        </p>
                        <div className="mt-3 flex flex-wrap items-end gap-2">
                            <p className="text-tk-deep text-[42px] leading-none font-semibold tracking-[-0.03em]">{slotTersedia}</p>
                            <span className="text-tk-deep mb-0.5 inline-flex items-center gap-1 rounded-full bg-white/30 px-2 py-0.5 text-[11px] font-semibold">
                                <UserRound className="size-3" aria-hidden="true" />
                                {persenTerisi}% terisi
                            </span>
                        </div>
                        <p className="text-tk-deep/75 mt-2 text-[11px]">dari {totalSlot} slot aktif minggu ini</p>
                    </div>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Total slot aktif</p>
                    <p className="text-tk-green-500 dark:text-tk-accent mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">
                        {totalSlot}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">dari {blok.length} blok jadwal</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Slot terisi</p>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{slotTerisi}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">pasien sudah terjadwal</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Hari aktif</p>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{hariAktif}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">dari {hariPraktik.length} hari praktik</p>
                </article>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="jadwal-mingguan">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 id="jadwal-mingguan" className="text-[17px] font-bold">
                                    Jadwal mingguan
                                </h2>
                                <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                    {blokAktif.length} blok aktif · {slotTersedia} slot masih tersedia
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => mulaiTambah()}
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold transition-colors"
                            >
                                <Plus className="size-3.5" aria-hidden="true" />
                                Tambah jadwal
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {hariPraktik.map((namaHari) => {
                                const daftarHari = blok
                                    .filter((item) => item.hari === namaHari)
                                    .sort((a, b) => toMenit(a.jamMulai) - toMenit(b.jamMulai));
                                const semuaLibur = daftarHari.length > 0 && daftarHari.every((item) => item.status === 'libur');
                                const slotHari = daftarHari.filter((item) => item.status === 'aktif').reduce((total, item) => total + item.kuota, 0);

                                return (
                                    <article key={namaHari} className={cn('flex flex-col rounded-[20px] p-4', glass)}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-sm font-bold">{namaHari}</h3>
                                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                    {daftarHari.length === 0 ? 'Belum ada jadwal' : semuaLibur ? 'Libur' : `${slotHari} slot`}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                                                    daftarHari.length === 0
                                                        ? 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]'
                                                        : semuaLibur
                                                          ? 'bg-tk-warning/15 text-tk-warning'
                                                          : 'bg-tk-success/15 text-tk-success',
                                                )}
                                            >
                                                {daftarHari.length === 0 ? (
                                                    <Clock className="size-3" aria-hidden="true" />
                                                ) : semuaLibur ? (
                                                    <PowerOff className="size-3" aria-hidden="true" />
                                                ) : (
                                                    <CheckCircle2 className="size-3" aria-hidden="true" />
                                                )}
                                                {daftarHari.length === 0 ? 'Kosong' : semuaLibur ? 'Libur' : 'Aktif'}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid gap-2">
                                            {daftarHari.length === 0 ? (
                                                <p className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-4 text-center text-[10px] text-[var(--tk-muted)]">
                                                    Tambahkan jam praktik untuk hari ini.
                                                </p>
                                            ) : (
                                                daftarHari.map((item) => {
                                                    const IkonMode = item.mode === 'teks' ? MessageSquare : Video;
                                                    const penuh = item.status === 'aktif' && item.terisi >= item.kuota;
                                                    const persen = item.kuota > 0 ? Math.min(Math.round((item.terisi / item.kuota) * 100), 100) : 0;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={cn(
                                                                'rounded-xl border px-3 py-2.5',
                                                                item.status === 'libur'
                                                                    ? 'border-dashed border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)]'
                                                                    : 'border-transparent bg-[var(--tk-page-alt)]',
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold">
                                                                        {formatJam(item.jamMulai)}–{formatJam(item.jamSelesai)}
                                                                        <span className="ml-1 text-[9px] font-semibold text-[var(--tk-muted)]">
                                                                            WITA
                                                                        </span>
                                                                    </p>
                                                                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                                                        <IkonMode className="size-3" aria-hidden="true" />
                                                                        {labelModeJadwal[item.mode]} · {item.kuota} slot
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={cn(
                                                                        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold',
                                                                        item.status === 'libur'
                                                                            ? 'bg-tk-warning/15 text-tk-warning'
                                                                            : penuh
                                                                              ? 'bg-tk-danger/15 text-tk-danger'
                                                                              : 'bg-tk-success/15 text-tk-success',
                                                                    )}
                                                                >
                                                                    {item.status === 'libur' ? 'Libur' : penuh ? 'Penuh' : 'Tersedia'}
                                                                </span>
                                                            </div>

                                                            {item.status === 'aktif' && (
                                                                <div className="mt-2">
                                                                    <div
                                                                        className="h-1.5 overflow-hidden rounded-full bg-[var(--tk-glass-border)]"
                                                                        aria-hidden="true"
                                                                    >
                                                                        <span
                                                                            className={cn(
                                                                                'block h-full rounded-full',
                                                                                penuh ? 'bg-tk-danger' : 'bg-tk-green-500 dark:bg-tk-accent',
                                                                            )}
                                                                            style={{ width: `${persen}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="mt-1 text-[9px] text-[var(--tk-muted)]">
                                                                        {item.terisi} dari {item.kuota} slot terisi
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="mt-2 flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => mulaiEdit(item)}
                                                                    aria-label={`Ubah jadwal ${namaHari} ${formatJam(item.jamMulai)}`}
                                                                    className="grid size-9 place-items-center rounded-full text-[var(--tk-muted)] transition-colors hover:bg-[var(--tk-glass)] hover:text-[var(--tk-text)]"
                                                                >
                                                                    <Pencil className="size-3.5" aria-hidden="true" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => ubahStatus(item, item.status === 'libur' ? 'aktif' : 'libur')}
                                                                    aria-label={
                                                                        item.status === 'libur'
                                                                            ? `Aktifkan jadwal ${namaHari} ${formatJam(item.jamMulai)}`
                                                                            : `Liburkan jadwal ${namaHari} ${formatJam(item.jamMulai)}`
                                                                    }
                                                                    className="grid size-9 place-items-center rounded-full text-[var(--tk-muted)] transition-colors hover:bg-[var(--tk-glass)] hover:text-[var(--tk-text)]"
                                                                >
                                                                    {item.status === 'libur' ? (
                                                                        <Power className="size-3.5" aria-hidden="true" />
                                                                    ) : (
                                                                        <PowerOff className="size-3.5" aria-hidden="true" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => hapusBlok(item)}
                                                                    aria-label={`Hapus jadwal ${namaHari} ${formatJam(item.jamMulai)}`}
                                                                    className="text-tk-danger/80 hover:bg-tk-danger/10 hover:text-tk-danger grid size-9 place-items-center rounded-full transition-colors"
                                                                >
                                                                    <Trash2 className="size-3.5" aria-hidden="true" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => mulaiTambah(namaHari)}
                                            className="hover:border-tk-green-500/50 mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full border border-dashed border-[var(--tk-glass-border)] text-[10px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                        >
                                            <Plus className="size-3" aria-hidden="true" />
                                            Tambah {namaHari}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section id="form-jadwal" aria-labelledby="judul-form-jadwal" className={cn('scroll-mt-6 rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <CalendarDays className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="judul-form-jadwal" className="text-[15px] font-bold">
                                    {editId === null ? 'Tambah jadwal' : 'Ubah jadwal'}
                                </h2>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    {editId === null ? 'Tentukan hari, jam, kuota, dan mode konsultasi.' : 'Perbarui blok jadwal yang dipilih.'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={simpanBlok} noValidate className="mt-4 grid gap-4">
                            <div>
                                <label htmlFor="hari" className="text-[11px] font-bold">
                                    Hari praktik
                                </label>
                                <select
                                    id="hari"
                                    value={hari}
                                    onChange={(event) => setHari(event.target.value as HariPraktik)}
                                    className={cn(selectClass, 'mt-2')}
                                >
                                    {hariPraktik.map((namaHari) => (
                                        <option key={namaHari} value={namaHari}>
                                            {namaHari}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="jamMulai" className="text-[11px] font-bold">
                                        Jam mulai
                                    </label>
                                    <Input
                                        id="jamMulai"
                                        type="time"
                                        value={jamMulai}
                                        onChange={(event) => {
                                            setJamMulai(event.target.value);
                                            setErrors((previous) => ({ ...previous, jamMulai: undefined, bentrok: undefined }));
                                        }}
                                        aria-invalid={Boolean(errors.jamMulai || errors.bentrok)}
                                        className={cn(inputClass, 'mt-2')}
                                    />
                                    <InputError message={errors.jamMulai} className="text-tk-danger mt-1.5 text-[10px]" />
                                </div>

                                <div>
                                    <label htmlFor="jamSelesai" className="text-[11px] font-bold">
                                        Jam selesai
                                    </label>
                                    <Input
                                        id="jamSelesai"
                                        type="time"
                                        value={jamSelesai}
                                        onChange={(event) => {
                                            setJamSelesai(event.target.value);
                                            setErrors((previous) => ({ ...previous, jamSelesai: undefined, bentrok: undefined }));
                                        }}
                                        aria-invalid={Boolean(errors.jamSelesai || errors.bentrok)}
                                        className={cn(inputClass, 'mt-2')}
                                    />
                                    <InputError message={errors.jamSelesai} className="text-tk-danger mt-1.5 text-[10px]" />
                                </div>
                            </div>
                            <InputError message={errors.bentrok} className="text-tk-danger -mt-2 text-[10px]" />

                            <div>
                                <label htmlFor="kuota" className="text-[11px] font-bold">
                                    Kuota slot
                                </label>
                                <Input
                                    id="kuota"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={kuota}
                                    onChange={(event) => {
                                        setKuota(event.target.value);
                                        setErrors((previous) => ({ ...previous, kuota: undefined }));
                                    }}
                                    aria-invalid={Boolean(errors.kuota)}
                                    className={cn(inputClass, 'mt-2')}
                                />
                                {blokDiedit && blokDiedit.status === 'aktif' && blokDiedit.terisi > 0 && (
                                    <p className="mt-1.5 text-[10px] text-[var(--tk-muted)]">
                                        Sudah terisi {blokDiedit.terisi} slot. Kuota tidak boleh lebih kecil dari jumlah tersebut.
                                    </p>
                                )}
                                <InputError message={errors.kuota} className="text-tk-danger mt-1.5 text-[10px]" />
                            </div>

                            <div>
                                <p className="text-[11px] font-bold">Mode konsultasi</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {modePilihan.map((nilai) => (
                                        <button
                                            key={nilai}
                                            type="button"
                                            aria-pressed={mode === nilai}
                                            onClick={() => setMode(nilai)}
                                            className={cn(
                                                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[10px] font-semibold transition-colors',
                                                mode === nilai
                                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                            )}
                                        >
                                            {nilai === 'teks' ? (
                                                <MessageSquare className="size-3" aria-hidden="true" />
                                            ) : (
                                                <Video className="size-3" aria-hidden="true" />
                                            )}
                                            {labelModeJadwal[nilai]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[11px] font-bold">Status jadwal</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {statusPilihan.map((nilai) => (
                                        <button
                                            key={nilai}
                                            type="button"
                                            aria-pressed={status === nilai}
                                            onClick={() => setStatus(nilai)}
                                            className={cn(
                                                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[10px] font-semibold transition-colors',
                                                status === nilai
                                                    ? nilai === 'libur'
                                                        ? 'bg-tk-warning text-tk-deep border-transparent'
                                                        : 'bg-tk-accent text-tk-deep border-transparent'
                                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                            )}
                                        >
                                            {nilai === 'libur' ? (
                                                <PowerOff className="size-3" aria-hidden="true" />
                                            ) : (
                                                <Power className="size-3" aria-hidden="true" />
                                            )}
                                            {nilai === 'libur' ? 'Libur' : 'Aktif'}
                                        </button>
                                    ))}
                                </div>
                                {status === 'libur' && (
                                    <p className="bg-tk-warning/10 mt-2 rounded-xl px-3 py-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Slot libur dilepas dari pendaftaran. Pasien yang sudah terdaftar akan dihubungi untuk penjadwalan ulang.
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2 sm:flex">
                                <button
                                    type="submit"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-bold transition-colors"
                                >
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                    {editId === null ? 'Simpan jadwal' : 'Perbarui jadwal'}
                                </button>
                                {editId !== null && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    <section aria-labelledby="panduan-jadwal" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-2">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                <ShieldCheck className="size-4" aria-hidden="true" />
                            </span>
                            <h2 id="panduan-jadwal" className="text-[15px] font-bold">
                                Panduan singkat
                            </h2>
                        </div>
                        <ul className="mt-3 grid gap-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                            <li className="flex items-start gap-2">
                                <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Satu blok jadwal tidak boleh bertabrakan dengan blok aktif lain pada hari yang sama.
                            </li>
                            <li className="flex items-start gap-2">
                                <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Kuota menentukan jumlah pasien yang bisa mendaftar pada blok tersebut.
                            </li>
                            <li className="flex items-start gap-2">
                                <PowerOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Menandai libur akan melepas slot dan memicu penjadwalan ulang pasien.
                            </li>
                        </ul>
                    </section>

                    <section aria-label="Catatan koneksi" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Perubahan tersimpan di perangkat</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Saat offline, perubahan jadwal disimpan lokal dan disinkronkan ketika sinyal kembali. Data fiktif untuk prototipe
                                TeleKarang.
                            </p>
                        </div>
                    </section>

                    <section aria-label="Catatan mode konsultasi" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-info/15 text-tk-info grid size-9 shrink-0 place-items-center rounded-full">
                            <Info className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Mode teks dipakai saat sinyal pasien lemah. Pilih{' '}
                            <span className="font-semibold text-[var(--tk-text)]">Video & teks</span> agar mode dapat menyesuaikan kualitas koneksi.
                        </p>
                    </section>

                    <Link
                        href="/spesialis"
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                    >
                        Kembali ke beranda spesialis
                    </Link>
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
