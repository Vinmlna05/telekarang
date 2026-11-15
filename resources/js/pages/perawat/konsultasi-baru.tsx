import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Info,
    MapPin,
    Search,
    Send,
    ShieldCheck,
    UserPlus,
    UserRound,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

interface PasienRingkas {
    id: number;
    nama: string;
    usia: number | null;
    jenisKelamin: string;
    nik: string;
    noRm: string;
    alamat: string;
    telepon: string;
    punyaAkun: boolean;
}

interface PermintaanTerkirim {
    id: number;
    nomor: string;
    pasien: {
        nama: string;
        usia: number | null;
        noRm: string;
        punyaAkun: boolean;
    };
    keluhan: string;
    status: string;
    kedaluwarsa: string | null;
    dibuat: string;
}

interface KonsultasiBaruPerawatProps {
    pasien: PasienRingkas[];
    pasienTerpilihId: number | null;
    permintaanTerkirim: PermintaanTerkirim | null;
}

type FilterPasien = 'SEMUA' | 'TANPA_AKUN' | 'PUNYA_AKUN';
type FormErrors = Partial<Record<'pasien' | 'keluhan' | 'persetujuan', string>>;

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const durasiKeluhan = ['Kurang dari 1 hari', '1–3 hari', '4–7 hari', 'Lebih dari 1 minggu'];

const langkahSetelahKirim = [
    'Permintaan masuk antrean dengan status Menunggu skrining.',
    'Lengkapi tanda vital dan keluhan utama pada form skrining.',
    'Dokter umum mereview hasil sebelum diteruskan ke spesialis.',
    'Setelah disetujui, perawat memilih dokter spesialis dan slot jadwal.',
];

function inisial(nama: string): string {
    return (
        nama
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((bagian) => bagian.charAt(0).toUpperCase())
            .join('') || 'PS'
    );
}

function maskNik(nik: string): string {
    if (nik.length < 8) {
        return nik;
    }

    return `${nik.slice(0, 4)}••••••••${nik.slice(-4)}`;
}

function SectionHeading({ step, title, description }: { step: number; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold">
                {step}
            </span>
            <div>
                <h2 className="text-[15px] font-bold">{title}</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">{description}</p>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, caption }: { icon: LucideIcon; label: string; value: string; caption?: string }) {
    return (
        <div>
            <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                <Icon className="size-3" aria-hidden="true" />
                {label}
            </dt>
            <dd className="mt-1 text-[11px] font-bold">{value}</dd>
            {caption && <dd className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{caption}</dd>}
        </div>
    );
}

export default function KonsultasiBaruPerawat({ pasien, pasienTerpilihId, permintaanTerkirim }: KonsultasiBaruPerawatProps) {
    const [q, setQ] = useState('');
    const [filterPasien, setFilterPasien] = useState<FilterPasien>('SEMUA');
    const [pasienId, setPasienId] = useState<number | null>(pasienTerpilihId);
    const [keluhan, setKeluhan] = useState('');
    const [durasi, setDurasi] = useState(durasiKeluhan[1]);
    const [setuju, setSetuju] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [mengirim, setMengirim] = useState(false);

    const jumlahTanpaAkun = useMemo(() => pasien.filter((item) => !item.punyaAkun).length, [pasien]);

    const pasienTersaring = useMemo(() => {
        const kataKunci = q.trim().toLowerCase();

        return pasien.filter((item) => {
            const cocokFilter =
                filterPasien === 'SEMUA' || (filterPasien === 'TANPA_AKUN' && !item.punyaAkun) || (filterPasien === 'PUNYA_AKUN' && item.punyaAkun);
            const cocokKataKunci =
                kataKunci === '' || [item.nama, item.nik, item.noRm, item.alamat].some((nilai) => nilai.toLowerCase().includes(kataKunci));

            return cocokFilter && cocokKataKunci;
        });
    }, [pasien, q, filterPasien]);

    const pasienTerpilih = pasien.find((item) => item.id === pasienId) ?? null;

    function kirim(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};

        if (pasienId === null) {
            nextErrors.pasien = 'Pilih pasien terlebih dahulu.';
        }

        if (keluhan.trim().length < 10) {
            nextErrors.keluhan = 'Keluhan utama minimal 10 karakter.';
        }

        if (!setuju) {
            nextErrors.persetujuan = 'Persetujuan pasien wajib dicentang.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setMengirim(true);

        router.post(
            '/perawat/konsultasi',
            { pasien: pasienId, keluhan: keluhan.trim(), durasi, persetujuan: setuju },
            {
                preserveScroll: true,
                onFinish: () => setMengirim(false),
                onError: (serverErrors) => setErrors(serverErrors as FormErrors),
            },
        );
    }

    if (permintaanTerkirim) {
        return (
            <PerawatAppLayout
                active="antrean"
                title="Permintaan terkirim"
                description="Permintaan konsultasi tercatat dan siap masuk tahap skrining."
            >
                <Head title="Permintaan terkirim" />

                <div className="mx-auto max-w-2xl">
                    <section className={cn('overflow-hidden rounded-[24px]', glass)}>
                        <div className="text-tk-deep bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)] p-5 md:p-6">
                            <span className="bg-tk-deep/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                                <CheckCircle2 className="size-3" aria-hidden="true" />
                                Permintaan tercatat
                            </span>
                            <h1 className="mt-3 text-2xl leading-tight font-extrabold">Menunggu skrining perawat</h1>
                            <p className="text-tk-deep/75 mt-1 text-xs">{permintaanTerkirim.nomor}</p>
                        </div>

                        <dl className="grid gap-3 p-5 text-[11px] sm:grid-cols-2 md:p-6">
                            <InfoRow
                                icon={UserRound}
                                label="Pasien"
                                value={permintaanTerkirim.pasien.nama}
                                caption={permintaanTerkirim.pasien.noRm}
                            />
                            <InfoRow
                                icon={Users}
                                label="Akun"
                                value={permintaanTerkirim.pasien.punyaAkun ? 'Punya akun pasien' : 'Tanpa akun'}
                                caption={permintaanTerkirim.pasien.usia !== null ? `${permintaanTerkirim.pasien.usia} tahun` : undefined}
                            />
                            <InfoRow icon={Clock} label="Dibuat" value={permintaanTerkirim.dibuat} />
                            <InfoRow
                                icon={ClipboardList}
                                label="Batas skrining"
                                value={permintaanTerkirim.kedaluwarsa ?? '-'}
                                caption="Permintaan kedaluwarsa bila tidak diskrining."
                            />
                            <div className="sm:col-span-2">
                                <dt className="text-[10px] font-semibold text-[var(--tk-muted)]">Keluhan utama</dt>
                                <dd className="mt-1 text-[11px] leading-relaxed">{permintaanTerkirim.keluhan}</dd>
                            </div>
                        </dl>

                        <div className="border-t border-[var(--tk-glass-border)] p-5 md:p-6">
                            <h2 className="text-[13px] font-bold">Langkah selanjutnya</h2>
                            <ol className="mt-2 grid gap-1.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                {langkahSetelahKirim.map((langkah, index) => (
                                    <li key={langkah} className="flex items-start gap-2">
                                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold">
                                            {index + 1}
                                        </span>
                                        {langkah}
                                    </li>
                                ))}
                            </ol>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    href={`/perawat/skrining/${permintaanTerkirim.id}`}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                                >
                                    Lanjut isi skrining
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/perawat/permintaan"
                                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-bold"
                                >
                                    Kembali ke antrean
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </PerawatAppLayout>
        );
    }

    return (
        <PerawatAppLayout
            active="antrean"
            title="Ajukan konsultasi pasien"
            description="Daftarkan permintaan konsultasi atas nama pasien, termasuk pasien tanpa akun."
        >
            <Head title="Ajukan konsultasi" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/perawat/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke antrean
                </Link>
                <Link
                    href="/perawat/pasien"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 text-[11px] font-semibold"
                >
                    <UserPlus className="size-3.5" aria-hidden="true" />
                    Daftarkan pasien baru
                </Link>
            </div>

            <form onSubmit={kirim} className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="langkah-pasien">
                        <SectionHeading
                            step={1}
                            title="Pilih pasien"
                            description="Hanya pasien terverifikasi yang bisa diajukan. Pasien tanpa akun tetap bisa dilayani."
                        />
                        <span id="langkah-pasien" className="sr-only">
                            Pilih pasien
                        </span>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {(
                                [
                                    ['SEMUA', 'Semua'],
                                    ['TANPA_AKUN', `Tanpa akun (${jumlahTanpaAkun})`],
                                    ['PUNYA_AKUN', 'Punya akun'],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setFilterPasien(value)}
                                    className={cn(
                                        'min-h-9 rounded-full px-3 text-[10px] font-bold transition-colors',
                                        filterPasien === value
                                            ? 'bg-tk-accent text-tk-deep'
                                            : 'border border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                    )}
                                    aria-pressed={filterPasien === value}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="relative mt-3">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--tk-muted)]"
                                aria-hidden="true"
                            />
                            <Input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Cari nama, NIK, atau nomor RM"
                                className={inputClass}
                                aria-label="Cari pasien"
                            />
                        </div>

                        {errors.pasien && <p className="text-tk-danger mt-2 text-[10px] font-semibold">{errors.pasien}</p>}

                        <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Daftar pasien">
                            {pasienTersaring.length === 0 && (
                                <p className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-center text-[11px] text-[var(--tk-muted)]">
                                    Tidak ada pasien yang cocok. Daftarkan pasien baru terlebih dahulu.
                                </p>
                            )}

                            {pasienTersaring.map((item) => {
                                const dipilih = item.id === pasienId;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={dipilih}
                                        onClick={() => {
                                            setPasienId(item.id);
                                            setErrors((prev) => ({ ...prev, pasien: undefined }));
                                        }}
                                        className={cn(
                                            'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                                            dipilih
                                                ? 'border-tk-green-400/60 bg-tk-green-500/[0.08]'
                                                : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                        )}
                                    >
                                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                                            {inisial(item.nama)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-xs font-bold">{item.nama}</span>
                                                <span className="rounded-full bg-[var(--tk-page-alt)] px-2 py-0.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                                    {item.punyaAkun ? 'Akun pasien' : 'Tanpa akun'}
                                                </span>
                                            </span>
                                            <span className="mt-0.5 block text-[10px] text-[var(--tk-muted)]">
                                                {item.usia !== null ? `${item.usia} tahun · ` : ''}
                                                {item.jenisKelamin === 'L' ? 'Laki-laki' : item.jenisKelamin === 'P' ? 'Perempuan' : '-'} ·{' '}
                                                {item.noRm}
                                            </span>
                                            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                                {item.alamat || 'Alamat belum diisi'}
                                            </span>
                                            {item.nik && (
                                                <span className="mt-0.5 block font-mono text-[10px] text-[var(--tk-muted)]">{maskNik(item.nik)}</span>
                                            )}
                                        </span>
                                        {dipilih && (
                                            <CheckCircle2
                                                className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="langkah-keluhan">
                        <SectionHeading
                            step={2}
                            title="Keluhan utama"
                            description="Tuliskan keluhan dengan bahasa pasien. Data tanda vital diisi perawat pada tahap skrining."
                        />
                        <span id="langkah-keluhan" className="sr-only">
                            Keluhan utama
                        </span>

                        <label htmlFor="keluhan" className="mt-4 block text-[10px] font-semibold text-[var(--tk-muted)]">
                            Keluhan
                        </label>
                        <textarea
                            id="keluhan"
                            value={keluhan}
                            onChange={(event) => {
                                setKeluhan(event.target.value);
                                setErrors((prev) => ({ ...prev, keluhan: undefined }));
                            }}
                            placeholder="Contoh: Demam sejak 3 hari, batuk berdahak, sesak saat aktivitas."
                            className={textareaClass}
                            maxLength={2000}
                        />
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <InputError message={errors.keluhan} />
                            <span className="text-[10px] text-[var(--tk-muted)]">{keluhan.length}/2000</span>
                        </div>

                        <p className="mt-4 text-[10px] font-semibold text-[var(--tk-muted)]">Sudah berapa lama?</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {durasiKeluhan.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setDurasi(item)}
                                    className={cn(
                                        'min-h-9 rounded-full px-3 text-[10px] font-semibold transition-colors',
                                        durasi === item
                                            ? 'bg-tk-accent text-tk-deep'
                                            : 'border border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                    )}
                                    aria-pressed={durasi === item}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="langkah-konfirmasi">
                        <SectionHeading
                            step={3}
                            title="Konfirmasi"
                            description="Minta persetujuan pasien sebelum permintaan dikirim ke antrean skrining."
                        />
                        <span id="langkah-konfirmasi" className="sr-only">
                            Konfirmasi
                        </span>

                        <label className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3.5">
                            <Checkbox
                                checked={setuju}
                                onCheckedChange={(value) => {
                                    setSetuju(value === true);
                                    setErrors((prev) => ({ ...prev, persetujuan: undefined }));
                                }}
                                className="mt-0.5"
                            />
                            <span className="text-[11px] leading-relaxed">
                                Pasien atau keluarga sudah memahami tujuan konsultasi jarak jauh dan menyetujui pengiriman data untuk skrining.
                            </span>
                        </label>
                        <InputError message={errors.persetujuan} />

                        <button
                            type="submit"
                            disabled={mengirim}
                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-xs font-bold disabled:opacity-60"
                        >
                            <Send className="size-4" aria-hidden="true" />
                            {mengirim ? 'Mengirim...' : 'Kirim ke antrean skrining'}
                        </button>
                        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Permintaan tidak langsung dikirim ke spesialis. Skrining perawat dan review dokter umum menjadi gerbang wajib.
                        </p>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="ringkasan-permintaan">
                        <h2 id="ringkasan-permintaan" className="text-[15px] font-bold">
                            Ringkasan permintaan
                        </h2>
                        {pasienTerpilih ? (
                            <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                                <InfoRow icon={UserRound} label="Pasien" value={pasienTerpilih.nama} />
                                <InfoRow icon={ClipboardList} label="No. RM" value={pasienTerpilih.noRm || '-'} />
                                <InfoRow icon={Users} label="Usia" value={pasienTerpilih.usia !== null ? `${pasienTerpilih.usia} tahun` : '-'} />
                                <InfoRow icon={ShieldCheck} label="Akun" value={pasienTerpilih.punyaAkun ? 'Punya akun' : 'Tanpa akun'} />
                                <div className="col-span-2">
                                    <dt className="text-[10px] font-semibold text-[var(--tk-muted)]">Keluhan</dt>
                                    <dd className="mt-1 text-[11px] leading-relaxed">{keluhan || 'Belum diisi'}</dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="mt-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                Pilih pasien untuk melihat ringkasan permintaan.
                            </p>
                        )}
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="alur-permintaan">
                        <h2 id="alur-permintaan" className="flex items-center gap-1.5 text-[15px] font-bold">
                            <Info className="size-4" aria-hidden="true" />
                            Alur setelah dikirim
                        </h2>
                        <ol className="mt-3 grid gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            {langkahSetelahKirim.map((langkah, index) => (
                                <li key={langkah} className="flex items-start gap-2">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold">
                                        {index + 1}
                                    </span>
                                    {langkah}
                                </li>
                            ))}
                        </ol>
                    </section>
                </aside>
            </form>
        </PerawatAppLayout>
    );
}
