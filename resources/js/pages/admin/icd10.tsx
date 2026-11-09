import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    Database,
    Layers,
    LoaderCircle,
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
import { type SharedData } from '@/types';

interface Icd10Item {
    kode: string;
    nama: string;
    pemakaian: number;
}

type Icd10Form = {
    kode: string;
    nama: string;
};

interface Icd10Props {
    daftar: Icd10Item[];
}

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

const initialForm: Icd10Form = { kode: '', nama: '' };
const formatAngka = new Intl.NumberFormat('id-ID');

function kelompokKode(kode: string): string {
    const huruf = kode.trim().charAt(0).toUpperCase();

    return KELOMPOK[huruf] ?? 'Lainnya';
}

export default function Icd10({ daftar }: Icd10Props) {
    const { flash } = usePage<SharedData>().props;
    const [q, setQ] = useState('');
    const [kelompok, setKelompok] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKode, setEditingKode] = useState<string | null>(null);
    const [hapusTarget, setHapusTarget] = useState<Icd10Item | null>(null);

    const form = useForm<Icd10Form>({ ...initialForm });

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
        form.setData({ ...initialForm });
        form.clearErrors();
        setDialogOpen(true);
    };

    const bukaEdit = (item: Icd10Item) => {
        setEditingKode(item.kode);
        form.setData({ kode: item.kode, nama: item.nama });
        form.clearErrors();
        setDialogOpen(true);
    };

    const simpan: FormEventHandler = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setEditingKode(null);
                form.reset();
            },
        };

        if (editingKode !== null) {
            form.patch(route('admin.icd10.update', editingKode), options);
        } else {
            form.post(route('admin.icd10.store'), options);
        }
    };

    const konfirmasiHapus = () => {
        if (hapusTarget === null) {
            return;
        }

        router.delete(route('admin.icd10.destroy', hapusTarget.kode), {
            preserveScroll: true,
            onSuccess: () => setHapusTarget(null),
        });
    };

    const judulDialog = editingKode === null ? 'Tambah kode ICD-10' : 'Edit kode ICD-10';
    const kelompokPratinjau = form.data.kode.trim() === '' ? 'Belum ditentukan' : kelompokKode(form.data.kode);

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

            {flash?.success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-green-500/35 bg-tk-green-500/10 text-tk-green-500 dark:text-tk-accent mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium"
                >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div
                    role="alert"
                    className="border-tk-danger/35 bg-tk-danger/10 text-tk-danger mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{flash.error}</p>
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
                        form.clearErrors();
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
                                value={form.data.kode}
                                onChange={(event) => form.setData('kode', event.target.value.toUpperCase())}
                                disabled={form.processing}
                                placeholder="Contoh: J06.9"
                                className={cn(authInputClass, 'font-mono tracking-wide')}
                            />
                            <p className="text-[11px] text-[var(--tk-muted)]">
                                Kelompok terdeteksi: <span className="font-semibold">{kelompokPratinjau}</span>
                            </p>
                            <InputError message={form.errors.kode} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="icd-nama">Nama diagnosis</Label>
                            <Input
                                id="icd-nama"
                                type="text"
                                required
                                value={form.data.nama}
                                onChange={(event) => form.setData('nama', event.target.value)}
                                disabled={form.processing}
                                placeholder="Contoh: Infeksi saluran napas atas akut"
                                className={authInputClass}
                            />
                            <InputError message={form.errors.nama} className="text-tk-danger" />
                        </div>

                        <DialogFooter className="mt-1 gap-2">
                            <p className="mr-auto max-w-[26ch] text-[10px] leading-snug text-[var(--tk-muted)]">
                                Perubahan langsung tersimpan ke database.
                            </p>
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    className="min-h-11 rounded-full border border-[var(--tk-glass-border)] px-5 text-sm font-semibold disabled:opacity-50"
                                >
                                    Batal
                                </button>
                            </DialogClose>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white disabled:opacity-60"
                            >
                                {form.processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                                {form.processing ? 'Menyimpan...' : editingKode === null ? 'Tambah kode' : 'Simpan perubahan'}
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
