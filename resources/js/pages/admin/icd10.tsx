import { Head, Link } from '@inertiajs/react';
import {
    Ban,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    Database,
    Layers,
    Pencil,
    Plus,
    Search,
    Stethoscope,
    Trash2,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { authInputClass } from '@/components/password-field';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminAppLayout from '@/layouts/admin/admin-app-layout';
import { cn } from '@/lib/utils';

interface Icd10Item {
    kode: string;
    nama: string;
    pemakaian: number;
}

interface Icd10Form {
    kode: string;
    nama: string;
}

type Icd10Errors = Partial<Record<keyof Icd10Form, string>>;

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const KELOMPOK: Record<string, string> = {
    A: 'Infeksi & parasit',
    B: 'Infeksi & parasit',
    C: 'Neoplasma',
    D: 'Neoplasma',
    E: 'Endokrin & metabolik',
    F: 'Gangguan jiwa',
    G: 'Sistem saraf',
    H: 'Mata & telinga',
    I: 'Sistem sirkulasi',
    J: 'Sistem pernapasan',
    K: 'Sistem pencernaan',
    L: 'Kulit & jaringan bawah kulit',
    M: 'Muskuloskeletal',
    N: 'Ginjal & saluran kemih',
    O: 'Kehamilan & persalinan',
    R: 'Gejala & tanda',
    S: 'Cedera & keracunan',
    T: 'Cedera & keracunan',
    Z: 'Faktor kesehatan',
};

const icdAwal: Icd10Item[] = [
    { kode: 'A09', nama: 'Diare dan gastroenteritis', pemakaian: 11 },
    { kode: 'B34.2', nama: 'Infeksi virus corona, tidak dijelaskan', pemakaian: 3 },
    { kode: 'E11.9', nama: 'Diabetes melitus tipe 2 tanpa komplikasi', pemakaian: 6 },
    { kode: 'H10.9', nama: 'Konjungtivitis, tidak dijelaskan', pemakaian: 1 },
    { kode: 'H66.9', nama: 'Otitis media, tidak dijelaskan', pemakaian: 2 },
    { kode: 'I10', nama: 'Hipertensi esensial (primer)', pemakaian: 18 },
    { kode: 'I25.9', nama: 'Penyakit jantung iskemik kronik', pemakaian: 4 },
    { kode: 'J00', nama: 'Nasofaringitis akut (common cold)', pemakaian: 5 },
    { kode: 'J06.9', nama: 'Infeksi saluran napas atas akut', pemakaian: 15 },
    { kode: 'J18.9', nama: 'Pneumonia, tidak dijelaskan', pemakaian: 3 },
    { kode: 'J45.9', nama: 'Asma, tidak dijelaskan', pemakaian: 2 },
    { kode: 'K02.9', nama: 'Karies gigi, tidak dijelaskan', pemakaian: 1 },
    { kode: 'K29.7', nama: 'Gastritis, tidak dijelaskan', pemakaian: 7 },
    { kode: 'L30.9', nama: 'Dermatitis, tidak dijelaskan', pemakaian: 9 },
    { kode: 'M54.5', nama: 'Nyeri punggung bawah', pemakaian: 4 },
    { kode: 'N39.0', nama: 'Infeksi saluran kemih, lokasi tidak dijelaskan', pemakaian: 6 },
    { kode: 'O80', nama: 'Persalinan tunggal spontan', pemakaian: 0 },
    { kode: 'R05', nama: 'Batuk', pemakaian: 2 },
    { kode: 'R50.9', nama: 'Demam, tidak dijelaskan', pemakaian: 7 },
    { kode: 'R51', nama: 'Sakit kepala', pemakaian: 3 },
    { kode: 'S93.4', nama: 'Terkilir pergelangan kaki', pemakaian: 0 },
    { kode: 'Z00.0', nama: 'Pemeriksaan kesehatan umum', pemakaian: 0 },
];

const initialForm: Icd10Form = { kode: '', nama: '' };
const formatAngka = new Intl.NumberFormat('id-ID');

function kelompokKode(kode: string): string {
    const huruf = kode.trim().charAt(0).toUpperCase();

    return KELOMPOK[huruf] ?? 'Lainnya';
}

export default function Icd10() {
    const [daftar, setDaftar] = useState<Icd10Item[]>(icdAwal);
    const [q, setQ] = useState('');
    const [kelompok, setKelompok] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKode, setEditingKode] = useState<string | null>(null);
    const [form, setForm] = useState<Icd10Form>({ ...initialForm });
    const [errors, setErrors] = useState<Icd10Errors>({});
    const [flash, setFlash] = useState<string | null>(null);
    const [hapusTarget, setHapusTarget] = useState<Icd10Item | null>(null);

    const kelompokTersedia = useMemo(
        () => Array.from(new Set(daftar.map((item) => kelompokKode(item.kode)))).sort((a, b) => a.localeCompare(b, 'id')),
        [daftar],
    );

    const daftarTampil = useMemo(() => {
        const keyword = q.trim().toLowerCase();

        return daftar
            .filter((item) => {
                const cocokCari = keyword === '' || [item.kode, item.nama].some((nilai) => nilai.toLowerCase().includes(keyword));
                const cocokKelompok = kelompok === '' || kelompokKode(item.kode) === kelompok;

                return cocokCari && cocokKelompok;
            })
            .sort((a, b) => a.kode.localeCompare(b.kode));
    }, [daftar, q, kelompok]);

    const ringkasan = useMemo(
        () => ({
            total: daftar.length,
            kelompok: new Set(daftar.map((item) => kelompokKode(item.kode))).size,
            dipakai: daftar.filter((item) => item.pemakaian > 0).length,
            belumDipakai: daftar.filter((item) => item.pemakaian === 0).length,
        }),
        [daftar],
    );

    const totalPemakaian = useMemo(() => daftar.reduce((jumlah, item) => jumlah + item.pemakaian, 0), [daftar]);

    const filterAktif = q !== '' || kelompok !== '';

    const ringkasanCards: { key: keyof typeof ringkasan; label: string; caption: string; icon: LucideIcon; tone: string }[] = [
        {
            key: 'total',
            label: 'Total kode',
            caption: `${formatAngka.format(totalPemakaian)} pemakaian tercatat`,
            icon: BookOpen,
            tone: 'bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent',
        },
        {
            key: 'kelompok',
            label: 'Kelompok diagnosis',
            caption: 'bab ICD-10 terpakai',
            icon: Layers,
            tone: 'bg-tk-info/15 text-tk-info',
        },
        {
            key: 'dipakai',
            label: 'Kode dipakai',
            caption: 'pernah dipilih spesialis',
            icon: ClipboardList,
            tone: 'bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint',
        },
        {
            key: 'belumDipakai',
            label: 'Belum dipakai',
            caption: 'aman untuk dihapus',
            icon: Ban,
            tone: 'bg-tk-warning/15 text-tk-warning',
        },
    ];

    const resetFilter = () => {
        setQ('');
        setKelompok('');
    };

    const bukaTambah = () => {
        setEditingKode(null);
        setForm({ ...initialForm });
        setErrors({});
        setDialogOpen(true);
    };

    const bukaEdit = (item: Icd10Item) => {
        setEditingKode(item.kode);
        setForm({ kode: item.kode, nama: item.nama });
        setErrors({});
        setDialogOpen(true);
    };

    const ubahField = (key: keyof Icd10Form, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
    };

    const simpan: FormEventHandler = (event) => {
        event.preventDefault();

        const kode = form.kode.trim().toUpperCase();
        const nama = form.nama.trim();
        const next: Icd10Errors = {};

        if (kode === '') {
            next.kode = 'Kode ICD-10 wajib diisi.';
        } else if (!/^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/.test(kode)) {
            next.kode = 'Format kode tidak valid. Contoh: I10 atau J06.9.';
        } else if (daftar.some((item) => item.kode === kode && item.kode !== editingKode)) {
            next.kode = 'Kode sudah ada di daftar.';
        }

        if (nama === '') {
            next.nama = 'Nama diagnosis wajib diisi.';
        } else if (nama.length < 3) {
            next.nama = 'Nama diagnosis minimal 3 karakter.';
        }

        if (Object.keys(next).length > 0) {
            setErrors(next);

            return;
        }

        if (editingKode !== null) {
            setDaftar((current) => current.map((item) => (item.kode === editingKode ? { ...item, kode, nama } : item)));
            setFlash(`Kode ${kode} berhasil diperbarui.`);
        } else {
            setDaftar((current) => [...current, { kode, nama, pemakaian: 0 }]);
            setFlash(`Kode ${kode} berhasil ditambahkan.`);
        }

        setDialogOpen(false);
        setErrors({});
    };

    const konfirmasiHapus = () => {
        if (hapusTarget === null) {
            return;
        }

        setDaftar((current) => current.filter((item) => item.kode !== hapusTarget.kode));
        setFlash(`Kode ${hapusTarget.kode} berhasil dihapus.`);
        setHapusTarget(null);
    };

    const judulDialog = editingKode === null ? 'Tambah kode ICD-10' : 'Edit kode ICD-10';
    const kelompokPratinjau = form.kode.trim() === '' ? 'Belum ditentukan' : kelompokKode(form.kode);

    return (
        <AdminAppLayout
            active="master"
            title="Kelola data ICD-10"
            description="Jaga daftar diagnosis tetap ringkas dan relevan. Kode ini menjadi pilihan wajib dokter spesialis saat mengisi hasil konsultasi."
        >
            <Head title="Kelola data ICD-10" />

            <nav aria-label="Data master" className="mb-5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link
                    href={route('admin.dokter')}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--tk-glass-border)] px-4 text-[12px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <Stethoscope className="size-4" aria-hidden="true" />
                    Data dokter
                </Link>
                <span
                    aria-current="page"
                    className="bg-tk-accent text-tk-deep inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[12px] font-bold"
                >
                    <Database className="size-4" aria-hidden="true" />
                    ICD-10
                </span>
            </nav>

            {flash && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-green-500/35 bg-tk-green-500/10 text-tk-green-500 dark:text-tk-accent mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium"
                >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{flash}</p>
                </div>
            )}

            <section aria-labelledby="info-icd10" className={cn('mb-5 rounded-[20px] p-4', glass)}>
                <div className="flex items-start gap-3">
                    <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                        <Database className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2 id="info-icd10" className="text-[13px] font-bold">
                            Kode yang sudah dipakai tidak dapat dihapus
                        </h2>
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tk-muted)]">
                            Hasil konsultasi menyimpan kode ICD-10 sebagai riwayat diagnosis. Nonaktifkan atau biarkan kode lama tetap ada; hapus
                            hanya kode yang belum pernah dipakai.
                        </p>
                    </div>
                </div>
            </section>

            <section aria-label="Ringkasan ICD-10" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

            <Dialog
                open={dialogOpen}
                onOpenChange={(next) => {
                    setDialogOpen(next);

                    if (!next) {
                        setErrors({});
                    }
                }}
            >
                <section aria-label="Cari dan kelola kode ICD-10" className={cn('mt-5 rounded-[22px] p-4', glass)}>
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-[420px]">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                aria-hidden="true"
                            />
                            <Input
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Cari kode atau nama diagnosis..."
                                aria-label="Cari kode ICD-10 berdasarkan kode atau nama diagnosis"
                                className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                            />
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
                            <DialogTrigger asChild>
                                <button
                                    type="button"
                                    onClick={bukaTambah}
                                    className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                                >
                                    <Plus className="size-4" aria-hidden="true" />
                                    Tambah kode
                                </button>
                            </DialogTrigger>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            aria-pressed={kelompok === ''}
                            onClick={() => setKelompok('')}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                kelompok === ''
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            Semua kelompok
                        </button>
                        {kelompokTersedia.map((value) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={kelompok === value}
                                onClick={() => setKelompok(kelompok === value ? '' : value)}
                                className={cn(
                                    'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                    kelompok === value
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </section>

                <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-[24px] border-[var(--tk-glass-border)] bg-[var(--tk-page)] text-[var(--tk-text)] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                {editingKode === null ? (
                                    <Plus className="size-4" aria-hidden="true" />
                                ) : (
                                    <Pencil className="size-4" aria-hidden="true" />
                                )}
                            </span>
                            {judulDialog}
                        </DialogTitle>
                        <DialogDescription className="text-[var(--tk-muted)]">
                            Gunakan format ICD-10 resmi, misalnya I10 atau J06.9. Kode yang sama tidak boleh didaftarkan dua kali.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpan} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="icd-kode">Kode ICD-10</Label>
                            <Input
                                id="icd-kode"
                                type="text"
                                required
                                autoFocus
                                autoCapitalize="characters"
                                value={form.kode}
                                onChange={(event) => ubahField('kode', event.target.value.toUpperCase())}
                                placeholder="Contoh: J06.9"
                                className={cn(authInputClass, 'font-mono tracking-wide')}
                            />
                            <p className="text-[11px] text-[var(--tk-muted)]">
                                Kelompok terdeteksi: <span className="font-semibold">{kelompokPratinjau}</span>
                            </p>
                            <InputError message={errors.kode} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="icd-nama">Nama diagnosis</Label>
                            <Input
                                id="icd-nama"
                                type="text"
                                required
                                value={form.nama}
                                onChange={(event) => ubahField('nama', event.target.value)}
                                placeholder="Contoh: Infeksi saluran napas atas akut"
                                className={authInputClass}
                            />
                            <InputError message={errors.nama} className="text-tk-danger" />
                        </div>

                        <DialogFooter className="mt-1 gap-2">
                            <p className="mr-auto max-w-[26ch] text-[10px] leading-snug text-[var(--tk-muted)]">
                                Pratinjau frontend: perubahan hanya tersimpan selama halaman ini dibuka.
                            </p>
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    className="min-h-11 rounded-full border border-[var(--tk-glass-border)] px-5 text-sm font-semibold"
                                >
                                    Batal
                                </button>
                            </DialogClose>
                            <button
                                type="submit"
                                className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white"
                            >
                                {editingKode === null ? 'Tambah kode' : 'Simpan perubahan'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={hapusTarget !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setHapusTarget(null);
                    }
                }}
            >
                <DialogContent className="w-[calc(100%-1.5rem)] rounded-[24px] border-[var(--tk-glass-border)] bg-[var(--tk-page)] text-[var(--tk-text)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <span className="bg-tk-danger/15 text-tk-danger grid size-9 place-items-center rounded-full">
                                <Trash2 className="size-4" aria-hidden="true" />
                            </span>
                            Hapus kode ICD-10?
                        </DialogTitle>
                        <DialogDescription className="text-[var(--tk-muted)]">
                            Kode <span className="font-mono font-bold">{hapusTarget?.kode}</span> — {hapusTarget?.nama} akan dihapus dari daftar
                            pilihan diagnosis. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-1 gap-2">
                        <DialogClose asChild>
                            <button type="button" className="min-h-11 rounded-full border border-[var(--tk-glass-border)] px-5 text-sm font-semibold">
                                Batal
                            </button>
                        </DialogClose>
                        <button
                            type="button"
                            onClick={konfirmasiHapus}
                            className="bg-tk-danger inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white"
                        >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Hapus kode
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <section aria-labelledby="daftar-icd10" className={cn('mt-5 overflow-hidden rounded-[24px]', glass)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tk-glass-border)] p-5">
                    <div>
                        <h2 id="daftar-icd10" className="text-[17px] font-bold">
                            Daftar diagnosis ICD-10
                        </h2>
                        <p className="mt-0.5 text-[12px] text-[var(--tk-muted)]">
                            {filterAktif ? 'Hasil pencarian dan filter kelompok.' : 'Data master untuk dropdown diagnosis di form hasil konsultasi.'}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[11px] font-semibold text-[var(--tk-muted)]">
                        <BookOpen className="size-3.5" aria-hidden="true" />
                        {formatAngka.format(daftarTampil.length)} kode
                    </span>
                </div>

                {daftarTampil.length === 0 ? (
                    <div className="grid place-items-center px-6 py-14 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                            <Search className="size-5" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-bold">Tidak ada kode yang cocok</p>
                        <p className="mt-1 max-w-sm text-[12px] text-[var(--tk-muted)]">
                            Coba kata kunci lain atau tampilkan semua kelompok untuk melihat seluruh diagnosis.
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
                    <ul>
                        {daftarTampil.map((item) => (
                            <li
                                key={item.kode}
                                className="grid gap-3 border-b border-[var(--tk-glass-border)] p-4 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4 lg:px-5"
                            >
                                <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent border-tk-green-500/20 inline-flex w-fit min-w-[72px] items-center justify-center rounded-xl border px-3 py-2 font-mono text-[13px] font-bold tracking-wide tabular-nums">
                                    {item.kode}
                                </span>

                                <div className="min-w-0">
                                    <p className="text-sm font-bold">{item.nama}</p>
                                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[var(--tk-muted)]">
                                        <Layers className="size-3.5 shrink-0" aria-hidden="true" />
                                        {kelompokKode(item.kode)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold',
                                            item.pemakaian > 0
                                                ? 'bg-tk-green-500/12 text-tk-green-500 dark:bg-tk-accent/12 dark:text-tk-accent'
                                                : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                        )}
                                    >
                                        <ClipboardList className="size-3.5" aria-hidden="true" />
                                        {item.pemakaian > 0 ? `${formatAngka.format(item.pemakaian)} pemakaian` : 'Belum dipakai'}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => bukaEdit(item)}
                                        aria-label={`Edit kode ${item.kode}`}
                                        className="hover:border-tk-green-500/45 hover:text-tk-green-500 dark:hover:text-tk-accent inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3.5 text-[11px] font-semibold text-[var(--tk-text)] transition-colors"
                                    >
                                        <Pencil className="size-3.5" aria-hidden="true" />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHapusTarget(item)}
                                        disabled={item.pemakaian > 0}
                                        aria-label={
                                            item.pemakaian > 0
                                                ? `Kode ${item.kode} tidak dapat dihapus karena sudah dipakai`
                                                : `Hapus kode ${item.kode}`
                                        }
                                        title={item.pemakaian > 0 ? 'Tidak dapat dihapus karena sudah dipakai' : undefined}
                                        className="hover:border-tk-danger/45 hover:text-tk-danger grid size-10 place-items-center rounded-full border border-[var(--tk-glass-border)] text-[var(--tk-muted)] transition-colors enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AdminAppLayout>
    );
}
