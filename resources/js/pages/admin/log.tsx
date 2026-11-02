import { Head } from '@inertiajs/react';
import {
    Activity,
    Ban,
    BriefcaseMedical,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Database,
    Download,
    HeartPulse,
    History,
    LogIn,
    Pencil,
    Plus,
    Search,
    Send,
    ShieldCheck,
    Stethoscope,
    Trash2,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { authInputClass } from '@/components/password-field';
import { Input } from '@/components/ui/input';
import AdminAppLayout from '@/layouts/admin/admin-app-layout';
import { cn } from '@/lib/utils';

type AksiLog = 'membuat' | 'mengubah' | 'menghapus' | 'login' | 'menyetujui' | 'menolak' | 'mengirim' | 'menyelesaikan';
type EntitasLog = 'pengguna' | 'dokter' | 'icd10' | 'konsultasi' | 'skrining' | 'jadwal' | 'pasien' | 'sesi';
type PeranAktor = 'admin' | 'perawat' | 'dokter_umum' | 'spesialis';
type Periode = '' | 'hari' | 'minggu' | 'bulan';

interface LogItem {
    id: number;
    aktor: string;
    peran: PeranAktor;
    aksi: AksiLog;
    entitas: EntitasLog;
    entitasId: string;
    keterangan: string;
    waktu: string;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const aksiMeta: Record<AksiLog, { label: string; icon: LucideIcon; tone: string }> = {
    membuat: { label: 'Membuat', icon: Plus, tone: 'bg-tk-green-500/15 text-tk-green-500 dark:text-tk-accent' },
    mengubah: { label: 'Mengubah', icon: Pencil, tone: 'bg-tk-info/15 text-tk-info' },
    menghapus: { label: 'Menghapus', icon: Trash2, tone: 'bg-tk-danger/15 text-tk-danger' },
    login: { label: 'Login', icon: LogIn, tone: 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]' },
    menyetujui: { label: 'Menyetujui', icon: CheckCircle2, tone: 'bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint' },
    menolak: { label: 'Menolak', icon: Ban, tone: 'bg-tk-danger/15 text-tk-danger' },
    mengirim: { label: 'Mengirim', icon: Send, tone: 'bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent' },
    menyelesaikan: {
        label: 'Menyelesaikan',
        icon: ClipboardCheck,
        tone: 'bg-tk-green-500/15 text-tk-green-500 dark:text-tk-accent',
    },
};

const entitasMeta: Record<EntitasLog, string> = {
    pengguna: 'Pengguna',
    dokter: 'Dokter',
    icd10: 'ICD-10',
    konsultasi: 'Konsultasi',
    skrining: 'Skrining',
    jadwal: 'Jadwal',
    pasien: 'Pasien',
    sesi: 'Sesi',
};

const peranMeta: Record<PeranAktor, { label: string; icon: LucideIcon; badge: string }> = {
    admin: { label: 'Admin', icon: ShieldCheck, badge: 'border-transparent bg-tk-warning/15 text-tk-warning' },
    perawat: {
        label: 'Perawat',
        icon: HeartPulse,
        badge: 'border-transparent bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent',
    },
    dokter_umum: { label: 'Dokter umum', icon: Stethoscope, badge: 'border-transparent bg-tk-info/15 text-tk-info' },
    spesialis: {
        label: 'Dokter spesialis',
        icon: BriefcaseMedical,
        badge: 'border-transparent bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint',
    },
};

const periodeOptions: { value: Periode; label: string }[] = [
    { value: '', label: 'Semua waktu' },
    { value: 'hari', label: 'Hari ini' },
    { value: 'minggu', label: '7 hari' },
    { value: 'bulan', label: '30 hari' },
];

function menitLalu(menit: number): string {
    return new Date(Date.now() - menit * 60_000).toISOString();
}

const logAwal: LogItem[] = [
    {
        id: 18,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'membuat',
        entitas: 'dokter',
        entitasId: '7',
        keterangan: 'Menambahkan profil dr. Rina Kartika, Sp.OG sebagai dokter spesialis kandungan.',
        waktu: menitLalu(4),
    },
    {
        id: 17,
        aktor: 'Perawat Sari',
        peran: 'perawat',
        aksi: 'mengubah',
        entitas: 'skrining',
        entitasId: '12',
        keterangan: 'Memperbarui tanda vital skrining pasien Aisyah Rahmawati.',
        waktu: menitLalu(18),
    },
    {
        id: 16,
        aktor: 'dr. Budi Santoso',
        peran: 'dokter_umum',
        aksi: 'menyetujui',
        entitas: 'konsultasi',
        entitasId: '8',
        keterangan: 'Meneruskan permintaan konsultasi ke dokter spesialis anak.',
        waktu: menitLalu(47),
    },
    {
        id: 15,
        aktor: 'dr. Ayu Lestari, Sp.A',
        peran: 'spesialis',
        aksi: 'menyelesaikan',
        entitas: 'konsultasi',
        entitasId: '7',
        keterangan: 'Menyelesaikan konsultasi dengan diagnosis J06.9 dan keputusan tidak rujuk.',
        waktu: menitLalu(95),
    },
    {
        id: 14,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'mengubah',
        entitas: 'pengguna',
        entitasId: '14',
        keterangan: 'Mengubah peran akun Nurdin menjadi perawat.',
        waktu: menitLalu(150),
    },
    {
        id: 13,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'membuat',
        entitas: 'icd10',
        entitasId: 'R51',
        keterangan: 'Menambahkan diagnosis sakit kepala ke data master ICD-10.',
        waktu: menitLalu(230),
    },
    {
        id: 12,
        aktor: 'Perawat Sari',
        peran: 'perawat',
        aksi: 'mengirim',
        entitas: 'konsultasi',
        entitasId: '9',
        keterangan: 'Mengirim permintaan konsultasi ke dokter spesialis penyakit dalam.',
        waktu: menitLalu(340),
    },
    {
        id: 11,
        aktor: 'dr. Budi Santoso',
        peran: 'dokter_umum',
        aksi: 'menyetujui',
        entitas: 'konsultasi',
        entitasId: '9',
        keterangan: 'Menyetujui hasil skrining untuk diteruskan ke spesialis.',
        waktu: menitLalu(26 * 60),
    },
    {
        id: 10,
        aktor: 'dr. Ayu Lestari, Sp.A',
        peran: 'spesialis',
        aksi: 'menolak',
        entitas: 'konsultasi',
        entitasId: '6',
        keterangan: 'Menolak permintaan karena jadwal praktik penuh; pasien diminta memilih slot baru.',
        waktu: menitLalu(30 * 60),
    },
    {
        id: 9,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'menghapus',
        entitas: 'icd10',
        entitasId: 'Z00.0',
        keterangan: 'Menghapus kode yang belum pernah dipakai dari data master ICD-10.',
        waktu: menitLalu(2 * 24 * 60),
    },
    {
        id: 8,
        aktor: 'Perawat Sari',
        peran: 'perawat',
        aksi: 'membuat',
        entitas: 'pasien',
        entitasId: '10',
        keterangan: 'Mendaftarkan pasien baru tanpa akun atas nama Salim Abdullah.',
        waktu: menitLalu(3 * 24 * 60),
    },
    {
        id: 7,
        aktor: 'dr. Budi Santoso',
        peran: 'dokter_umum',
        aksi: 'mengubah',
        entitas: 'jadwal',
        entitasId: '5',
        keterangan: 'Mengubah jam praktik dokter umum menjadi 08.00–14.00.',
        waktu: menitLalu(4 * 24 * 60),
    },
    {
        id: 6,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'mengubah',
        entitas: 'dokter',
        entitasId: '3',
        keterangan: 'Memperbarui faskes dr. Hendra Wijaya menjadi RS Rujukan Daratan.',
        waktu: menitLalu(6 * 24 * 60),
    },
    {
        id: 5,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'membuat',
        entitas: 'pengguna',
        entitasId: '6',
        keterangan: 'Membuat akun dokter spesialis untuk dr. Ayu Lestari.',
        waktu: menitLalu(9 * 24 * 60),
    },
    {
        id: 4,
        aktor: 'Perawat Sari',
        peran: 'perawat',
        aksi: 'menyelesaikan',
        entitas: 'skrining',
        entitasId: '4',
        keterangan: 'Melengkapi skrining pasien dan menandai siap direview dokter umum.',
        waktu: menitLalu(14 * 24 * 60),
    },
    {
        id: 3,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'membuat',
        entitas: 'icd10',
        entitasId: 'O80',
        keterangan: 'Menambahkan diagnosis persalinan tunggal spontan.',
        waktu: menitLalu(21 * 24 * 60),
    },
    {
        id: 2,
        aktor: 'Reiki Admin',
        peran: 'admin',
        aksi: 'login',
        entitas: 'sesi',
        entitasId: '',
        keterangan: 'Masuk ke sistem dari perangkat puskesmas.',
        waktu: menitLalu(40 * 24 * 60),
    },
    {
        id: 1,
        aktor: 'Perawat Sari',
        peran: 'perawat',
        aksi: 'login',
        entitas: 'sesi',
        entitasId: '',
        keterangan: 'Masuk ke sistem untuk memulai antrean skrining.',
        waktu: menitLalu(55 * 24 * 60),
    },
];

const formatAngka = new Intl.NumberFormat('id-ID');
const formatTanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

function waktuRelatif(iso: string): string {
    const selisihMenit = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);

    if (selisihMenit < 1) {
        return 'baru saja';
    }

    if (selisihMenit < 60) {
        return `${selisihMenit} menit lalu`;
    }

    const selisihJam = Math.floor(selisihMenit / 60);

    if (selisihJam < 24) {
        return `${selisihJam} jam lalu`;
    }

    return `${Math.floor(selisihJam / 24)} hari lalu`;
}

function cocokRentang(iso: string, periode: Exclude<Periode, ''>): boolean {
    const waktu = new Date(iso);

    if (periode === 'hari') {
        return waktu.toDateString() === new Date().toDateString();
    }

    const selisih = Date.now() - waktu.getTime();
    const batasHari = periode === 'minggu' ? 7 : 30;

    return selisih <= batasHari * 24 * 60 * 60 * 1000;
}

export default function Log() {
    const [q, setQ] = useState('');
    const [aksi, setAksi] = useState<AksiLog | ''>('');
    const [entitas, setEntitas] = useState<EntitasLog | ''>('');
    const [periode, setPeriode] = useState<Periode>('');
    const [batas, setBatas] = useState(8);

    const daftarTampil = useMemo(() => {
        const keyword = q.trim().toLowerCase();

        return logAwal
            .filter((item) => {
                const cocokCari =
                    keyword === '' ||
                    [item.aktor, item.keterangan, item.entitasId, entitasMeta[item.entitas]].some((nilai) => nilai.toLowerCase().includes(keyword));
                const cocokAksi = aksi === '' || item.aksi === aksi;
                const cocokEntitas = entitas === '' || item.entitas === entitas;
                const cocokPeriode = periode === '' || cocokRentang(item.waktu, periode);

                return cocokCari && cocokAksi && cocokEntitas && cocokPeriode;
            })
            .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
    }, [q, aksi, entitas, periode]);

    const hariIniKey = new Date().toDateString();
    const ringkasan = {
        total: logAwal.length,
        hariIni: logAwal.filter((item) => new Date(item.waktu).toDateString() === hariIniKey).length,
        master: logAwal.filter((item) => item.entitas === 'pengguna' || item.entitas === 'dokter' || item.entitas === 'icd10').length,
        olehAdmin: logAwal.filter((item) => item.peran === 'admin').length,
    };

    const ringkasanCards: { key: keyof typeof ringkasan; label: string; caption: string; icon: LucideIcon; tone: string }[] = [
        {
            key: 'total',
            label: 'Total aktivitas',
            caption: 'tercatat di sistem',
            icon: History,
            tone: 'bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent',
        },
        {
            key: 'hariIni',
            label: 'Hari ini',
            caption: 'aktivitas terbaru',
            icon: Activity,
            tone: 'bg-tk-info/15 text-tk-info',
        },
        {
            key: 'master',
            label: 'Perubahan master',
            caption: 'pengguna, dokter, ICD-10',
            icon: Database,
            tone: 'bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint',
        },
        {
            key: 'olehAdmin',
            label: 'Oleh admin',
            caption: 'tindakan tercatat',
            icon: ShieldCheck,
            tone: 'bg-tk-warning/15 text-tk-warning',
        },
    ];

    const filterAktif = q !== '' || aksi !== '' || entitas !== '' || periode !== '';

    const resetFilter = () => {
        setQ('');
        setAksi('');
        setEntitas('');
        setPeriode('');
        setBatas(8);
    };

    const terlihat = daftarTampil.slice(0, batas);

    const eksporCsv = () => {
        const header = ['Waktu', 'Aktor', 'Peran', 'Aksi', 'Entitas', 'ID entitas', 'Keterangan'];
        const baris = daftarTampil.map((item) => [
            formatTanggal.format(new Date(item.waktu)),
            item.aktor,
            peranMeta[item.peran].label,
            aksiMeta[item.aksi].label,
            entitasMeta[item.entitas],
            item.entitasId,
            item.keterangan,
        ]);
        const csv = [header, ...baris].map((row) => row.map((sel) => `"${sel.replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
        const tautan = document.createElement('a');

        tautan.href = url;
        tautan.download = 'log-aktivitas-telekarang.csv';
        tautan.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminAppLayout
            active="log"
            title="Log aktivitas"
            description="Telusuri siapa mengubah apa dan kapan. Catatan dibuat otomatis untuk menjaga akuntabilitas data medis."
        >
            <Head title="Log aktivitas" />

            <section aria-labelledby="info-log" className={cn('mb-5 rounded-[20px] p-4', glass)}>
                <div className="flex items-start gap-3">
                    <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                        <History className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2 id="info-log" className="text-[13px] font-bold">
                            Log bersifat baca-saja
                        </h2>
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tk-muted)]">
                            Catatan aktivitas tidak dapat diubah atau dihapus dari antarmuka. Gunakan pencarian, filter, atau ekspor CSV untuk
                            menelusuri jejak perubahan.
                        </p>
                    </div>
                </div>
            </section>

            <section aria-label="Ringkasan log" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasanCards.map(({ key, label, caption, icon: Icon, tone }) => (
                    <article key={key} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-[var(--tk-muted)]">{label}</p>
                            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone)}>
                                <Icon className="size-4" aria-hidden="true" />
                            </span>
                        </div>
                        <p className="mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em]">{formatAngka.format(ringkasan[key])}</p>
                        <p className="mt-2 text-[10px] text-[var(--tk-muted)]">{caption}</p>
                    </article>
                ))}
            </section>

            <section aria-label="Cari dan filter log" className={cn('mt-5 rounded-[22px] p-4', glass)}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-[640px]">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                aria-hidden="true"
                            />
                            <Input
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Cari aktor, keterangan, atau kode..."
                                aria-label="Cari log aktivitas"
                                className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                            />
                        </div>
                        <div className="relative sm:w-[200px]">
                            <select
                                value={entitas}
                                onChange={(event) => setEntitas(event.target.value as EntitasLog | '')}
                                aria-label="Filter entitas"
                                className={cn(authInputClass, 'h-11 appearance-none rounded-full pr-9')}
                            >
                                <option value="">Semua entitas</option>
                                {(Object.keys(entitasMeta) as EntitasLog[]).map((value) => (
                                    <option key={value} value={value}>
                                        {entitasMeta[value]}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                aria-hidden="true"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {filterAktif && (
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="min-h-11 rounded-full px-3 text-[12px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                            >
                                Reset
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={eksporCsv}
                            className="hover:border-tk-green-500/45 hover:text-tk-green-500 dark:hover:text-tk-accent inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--tk-glass-border)] px-4 text-[12px] font-semibold transition-colors"
                        >
                            <Download className="size-4" aria-hidden="true" />
                            Ekspor CSV
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                        type="button"
                        aria-pressed={aksi === ''}
                        onClick={() => setAksi('')}
                        className={cn(
                            'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                            aksi === ''
                                ? 'bg-tk-accent text-tk-deep border-transparent'
                                : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                        )}
                    >
                        Semua aksi
                    </button>
                    {(Object.keys(aksiMeta) as AksiLog[]).map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={aksi === value}
                            onClick={() => setAksi(aksi === value ? '' : value)}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                aksi === value
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            {aksiMeta[value].label}
                        </button>
                    ))}
                </div>

                <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {periodeOptions.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={periode === value}
                            onClick={() => setPeriode(value)}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                periode === value
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            <section aria-labelledby="daftar-log" className={cn('mt-5 overflow-hidden rounded-[24px]', glass)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tk-glass-border)] p-5">
                    <div>
                        <h2 id="daftar-log" className="text-[17px] font-bold">
                            Riwayat aktivitas
                        </h2>
                        <p className="mt-0.5 text-[12px] text-[var(--tk-muted)]">
                            {filterAktif ? 'Hasil pencarian dan filter.' : 'Aktivitas terbaru dari seluruh peran, terurut dari yang paling baru.'}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[11px] font-semibold text-[var(--tk-muted)]">
                        <History className="size-3.5" aria-hidden="true" />
                        {formatAngka.format(daftarTampil.length)} catatan
                    </span>
                </div>

                {daftarTampil.length === 0 ? (
                    <div className="grid place-items-center px-6 py-14 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                            <Search className="size-5" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-bold">Tidak ada aktivitas yang cocok</p>
                        <p className="mt-1 max-w-sm text-[12px] text-[var(--tk-muted)]">
                            Coba kata kunci lain, pilih aksi berbeda, atau perluas rentang waktu.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilter}
                            className="border-tk-green-500/35 text-tk-green-500 dark:text-tk-accent mt-4 min-h-10 rounded-full border px-4 text-[12px] font-semibold"
                        >
                            Tampilkan semua
                        </button>
                    </div>
                ) : (
                    <>
                        <ul>
                            {terlihat.map((item) => {
                                const metaAksi = aksiMeta[item.aksi];
                                const AksiIcon = metaAksi.icon;
                                const metaPeran = peranMeta[item.peran];
                                const PeranIcon = metaPeran.icon;

                                return (
                                    <li
                                        key={item.id}
                                        className="grid gap-3 border-b border-[var(--tk-glass-border)] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-4 lg:px-5"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', metaAksi.tone)}>
                                                <AksiIcon className="size-4" aria-hidden="true" />
                                            </span>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-bold">{item.aktor}</p>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                            metaPeran.badge,
                                                        )}
                                                    >
                                                        <PeranIcon className="size-3" aria-hidden="true" />
                                                        {metaPeran.label}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-[12px] leading-relaxed text-[var(--tk-text)]">{item.keterangan}</p>

                                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                                                            metaAksi.tone,
                                                        )}
                                                    >
                                                        <AksiIcon className="size-3" aria-hidden="true" />
                                                        {metaAksi.label}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                                                        <Database className="size-3" aria-hidden="true" />
                                                        {entitasMeta[item.entitas]}
                                                        {item.entitasId !== '' && <span className="font-mono">#{item.entitasId}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pl-[52px] md:pl-0 md:text-right">
                                            <p className="text-[11px] font-semibold">{waktuRelatif(item.waktu)}</p>
                                            <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{formatTanggal.format(new Date(item.waktu))}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {batas < daftarTampil.length && (
                            <div className="flex flex-col items-center gap-2 border-t border-[var(--tk-glass-border)] p-4">
                                <p className="text-[11px] text-[var(--tk-muted)]">
                                    Menampilkan {formatAngka.format(terlihat.length)} dari {formatAngka.format(daftarTampil.length)} aktivitas.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setBatas((current) => current + 8)}
                                    className="border-tk-green-500/35 text-tk-green-500 dark:text-tk-accent min-h-10 rounded-full border px-4 text-[12px] font-semibold"
                                >
                                    Muat lebih banyak
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </AdminAppLayout>
    );
}
