import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Circle,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    ImagePlus,
    Info,
    Lock,
    MapPin,
    MessageSquare,
    Send,
    ShieldCheck,
    Stethoscope,
    Video,
    Wifi,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import ConnectionBadge from '@/components/connection-badge';
import InputError from '@/components/input-error';
import KeputusanRujukBanner from '@/components/keputusan-rujuk-banner';
import ResepObatCard from '@/components/resep-obat-card';
import { Input } from '@/components/ui/input';
import { bacaHasilSpesialis } from '@/data/hasil-spesialis';
import {
    modeKonsultasiLabels,
    statusKonsultasiLabels,
    type ModeKonsultasi,
    type PengirimPesan,
    type PesanKonsultasi,
    type StatusKonsultasi,
} from '@/data/konsultasi-pasien';
import { alasanKoneksi, useConnection } from '@/hooks/use-connection';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { bacaPesanLokal, dataUrlKeBerkas, kompresGambar, simpanPesanLokal } from '@/lib/chat';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface SkriningDetail {
    perawat: string;
    beratBadan: number;
    tinggiBadan: number;
    sistol: number;
    diastol: number;
    suhu: number;
    nadi: number;
    spo2: number;
    tandaBahaya: boolean;
    catatan: string;
    waktu: string;
}

interface HasilDetail {
    icd10Kode: string;
    icd10Nama: string;
    saran: string;
    keputusanRujuk: boolean;
    alasanRujuk: string | null;
    biayaRujukan: number | null;
    tindakLanjut: string;
    waktu: string;
}

interface KonsultasiDetailData {
    id: number;
    nomor: string;
    tanggal: string;
    tanggalSingkat: string;
    dokter: string;
    spesialisasi: string;
    faskes: string;
    jadwal: string;
    mode: ModeKonsultasi;
    status: StatusKonsultasi;
    keluhan: string;
    tautanVideo: string | null;
    skrining: SkriningDetail | null;
    hasil: HasilDetail | null;
    pesan: PesanKonsultasi[];
}

interface KonsultasiDetailProps {
    konsultasi: KonsultasiDetailData;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const langkahKonsultasi = ['Permintaan', 'Skrining', 'Review dokter', 'Spesialis', 'Konsultasi', 'Hasil'];

const progresKonsultasi: Record<StatusKonsultasi, { selesai: number; aktif: number | null; gagal?: number; peringatan?: number }> = {
    MENUNGGU_SKRINING: { selesai: 1, aktif: 1 },
    SKRINING_SELESAI: { selesai: 2, aktif: 2 },
    MENUNGGU_PEMILIHAN_SPESIALIS: { selesai: 3, aktif: 3 },
    MENUNGGU_SPESIALIS: { selesai: 3, aktif: 3 },
    DIJADWAL_ULANG: { selesai: 3, aktif: 3, peringatan: 3 },
    DIKONFIRMASI: { selesai: 4, aktif: 4 },
    BERLANGSUNG: { selesai: 4, aktif: 4 },
    SELESAI: { selesai: 6, aktif: null },
    DIRUJUK: { selesai: 6, aktif: null },
    DITANGANI_PUSKESMAS: { selesai: 6, aktif: null },
    DITOLAK: { selesai: 3, aktif: null, gagal: 3 },
    KEDALUWARSA: { selesai: 1, aktif: null, gagal: 1 },
    DIBATALKAN: { selesai: 0, aktif: null, gagal: 0 },
};

function sumberFoto(foto: string): string {
    return foto.startsWith('data:') || foto.startsWith('http') ? foto : `/storage/${foto}`;
}

const labelPengirim: Record<PengirimPesan, string> = {
    pasien: 'Anda',
    perawat: 'Perawat',
    spesialis: 'Dokter spesialis',
};

function inisial(nama: string, abaikanGelar = false): string {
    const namaBersih = abaikanGelar ? nama.replace(/^dr\.?\s+/i, '') : nama;

    return (
        namaBersih
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((bagian) => bagian.charAt(0).toUpperCase())
            .join('') || 'PS'
    );
}

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

interface HasilKirimPesan {
    berhasil: boolean;
    pesan?: string;
}

async function kirimPesanKeServer(konsultasiId: number, pesan: PesanKonsultasi, token: string): Promise<HasilKirimPesan> {
    const dataForm = new FormData();
    dataForm.append('isi', pesan.isi);
    dataForm.append('_token', token);

    if (pesan.foto) {
        const berkas = dataUrlKeBerkas(pesan.foto, `foto-${pesan.id}.jpg`);

        if (berkas) {
            dataForm.append('lampiran_foto', berkas);
        }
    }

    try {
        const respons = await fetch(`/pasien/konsultasi/${konsultasiId}/pesan`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'application/json',
            },
            body: dataForm,
            credentials: 'same-origin',
        });

        if (!respons.ok) {
            const galat = (await respons.json().catch(() => null)) as { message?: string } | null;

            return {
                berhasil: false,
                pesan: galat?.message ?? 'Pesan gagal dikirim. Coba lagi saat sinyal membaik.',
            };
        }

        return { berhasil: true };
    } catch {
        return {
            berhasil: false,
            pesan: 'Pesan gagal dikirim. Pesan disimpan dan akan dikirim ulang otomatis.',
        };
    }
}

export default function KonsultasiDetail({ konsultasi }: KonsultasiDetailProps) {
    const data = konsultasi;
    const hasil = data.hasil;
    const skrining = data.skrining;
    const koneksi = useConnection();
    const { csrf_token } = usePage<SharedData>().props;
    const kunciPesan = `telekarang:konsultasi-pasien:${data.id}`;
    const resepTersimpan = bacaHasilSpesialis(data.id)?.resep ?? null;

    const [pesanLokal, setPesanLokal] = useState<PesanKonsultasi[]>([]);
    const [pesanBaru, setPesanBaru] = useState('');
    const [mode, setMode] = useState<ModeKonsultasi>(data.mode);
    const [modeManual, setModeManual] = useState<ModeKonsultasi | null>(null);
    const [fotoLampiran, setFotoLampiran] = useState<string | null>(null);
    const [memprosesFoto, setMemprosesFoto] = useState(false);
    const [mengirim, setMengirim] = useState(false);
    const [errorPesan, setErrorPesan] = useState<string>();
    const [info, setInfo] = useState<string | null>(null);
    const [penyimpananPenuh, setPenyimpananPenuh] = useState(false);
    const [tersalin, setTersalin] = useState(false);

    const ujungChat = useRef<HTMLDivElement>(null);
    const sedangKirimAntrean = useRef(false);
    const semuaPesan = [...data.pesan, ...pesanLokal.filter((lokal) => !data.pesan.some((pesan) => pesan.id === lokal.id))];
    const progres = progresKonsultasi[data.status];
    const modeLabel = modeKonsultasiLabels[mode];
    const statusLabel = statusKonsultasiLabels[data.status];
    const tautanVideo = data.tautanVideo;
    const bisaChat = ['MENUNGGU_SPESIALIS', 'DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'].includes(data.status);

    const alasanMode =
        mode === 'teks'
            ? koneksi.status === 'offline'
                ? alasanKoneksi.offline
                : koneksi.status === 'lemah'
                  ? alasanKoneksi.lemah
                  : 'Mode teks dipilih manual agar konsultasi tetap berjalan saat sinyal tidak stabil.'
            : null;

    useEffect(() => {
        const tersimpan = bacaPesanLokal<PesanKonsultasi>(kunciPesan);

        setPesanLokal(tersimpan.map((pesan) => ({ ...pesan, statusKirim: 'MENUNGGU' as const })));
        setPesanBaru('');
        setFotoLampiran(null);
        setErrorPesan(undefined);
        setModeManual(null);
        setMode(data.mode);
        setInfo(null);
        setPenyimpananPenuh(false);
    }, [data.id, data.mode, kunciPesan]);

    useEffect(() => {
        if (modeManual !== null) {
            return;
        }

        setMode(koneksi.status === 'stabil' ? data.mode : 'teks');
    }, [koneksi.status, data.mode, modeManual]);

    useEffect(() => {
        if (koneksi.status === 'offline' || sedangKirimAntrean.current) {
            return;
        }

        const antrean = pesanLokal.filter((pesan) => pesan.statusKirim === 'MENUNGGU');

        if (antrean.length === 0) {
            return;
        }

        sedangKirimAntrean.current = true;

        void (async () => {
            let semuaTerkirim = true;

            for (const pesan of antrean) {
                const hasil = await kirimPesanKeServer(data.id, pesan, csrf_token);

                if (!hasil.berhasil) {
                    setErrorPesan(hasil.pesan);
                    semuaTerkirim = false;
                    break;
                }

                setPesanLokal((previous) => {
                    const sisa = previous.filter((item) => item.id !== pesan.id);

                    simpanPesanLokal(kunciPesan, sisa);

                    return sisa;
                });
            }

            sedangKirimAntrean.current = false;

            if (semuaTerkirim) {
                setInfo('Sinyal kembali. Pesan yang tertunda sudah dikirim.');
                router.reload({ only: ['konsultasi'] });
            }
        })();
    }, [koneksi.status, pesanLokal, data.id, kunciPesan, csrf_token]);

    useEffect(() => {
        if (pesanLokal.length === 0) {
            return;
        }

        setPenyimpananPenuh(!simpanPesanLokal(kunciPesan, pesanLokal));
    }, [kunciPesan, pesanLokal]);

    useEffect(() => {
        ujungChat.current?.scrollTo({ top: ujungChat.current.scrollHeight, behavior: 'smooth' });
    }, [semuaPesan.length]);

    function gantiMode(baru: ModeKonsultasi) {
        setModeManual(baru);
        setMode(baru);
        setInfo(baru === 'teks' ? 'Beralih ke mode teks + foto. Konsultasi tetap berjalan tanpa video.' : 'Kembali ke mode standar video + chat.');
    }

    async function salinTautan() {
        if (!tautanVideo) {
            setInfo('Dokter spesialis belum mengirim tautan video.');

            return;
        }

        try {
            await navigator.clipboard.writeText(tautanVideo);
            setTersalin(true);
            window.setTimeout(() => setTersalin(false), 2000);
        } catch {
            setInfo('Tautan tidak dapat disalin otomatis. Salin manual dari kolom tautan.');
        }
    }

    async function pilihFoto(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setErrorPesan('Lampiran harus berupa gambar.');
            return;
        }

        setMemprosesFoto(true);

        try {
            const hasil = await kompresGambar(file);
            setFotoLampiran(hasil);
            setErrorPesan(undefined);
        } catch {
            setErrorPesan('Foto gagal diproses. Coba gambar lain.');
        } finally {
            setMemprosesFoto(false);
        }
    }

    function hapusPesanLokal(id: number) {
        setPesanLokal((previous) => {
            const sisa = previous.filter((pesan) => pesan.id !== id);

            simpanPesanLokal(kunciPesan, sisa);

            return sisa;
        });
    }

    async function kirimPesan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const isi = pesanBaru.trim();

        if (isi.length === 0 && !fotoLampiran) {
            setErrorPesan('Tulis pesan atau lampirkan foto terlebih dahulu.');
            return;
        }

        if (!bisaChat) {
            setErrorPesan('Ruang konsultasi terbuka setelah dokter spesialis ditentukan.');
            return;
        }

        const pesanBaruLokal: PesanKonsultasi = {
            id: Date.now(),
            pengirim: 'pasien',
            isi: isi.length > 0 ? isi : 'Mengirim foto kondisi saya.',
            waktu: 'Baru saja',
            foto: fotoLampiran,
            statusKirim: 'MENUNGGU',
        };

        setPesanLokal((previous) => [...previous, pesanBaruLokal]);
        setPesanBaru('');
        setFotoLampiran(null);
        setErrorPesan(undefined);

        if (koneksi.status === 'offline') {
            setInfo('Anda sedang offline. Pesan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.');

            return;
        }

        setMengirim(true);
        const hasil = await kirimPesanKeServer(data.id, pesanBaruLokal, csrf_token);
        setMengirim(false);

        if (!hasil.berhasil) {
            setErrorPesan(hasil.pesan);

            return;
        }

        hapusPesanLokal(pesanBaruLokal.id);
        router.reload({ only: ['konsultasi'] });
    }

    const tandaVital = skrining
        ? [
              { label: 'Berat badan', nilai: String(skrining.beratBadan), satuan: 'kg' },
              { label: 'Tinggi badan', nilai: String(skrining.tinggiBadan), satuan: 'cm' },
              { label: 'Tekanan darah', nilai: `${skrining.sistol}/${skrining.diastol}`, satuan: 'mmHg' },
              { label: 'Suhu tubuh', nilai: angkaDesimal(skrining.suhu), satuan: '°C' },
              { label: 'Nadi', nilai: String(skrining.nadi), satuan: 'x/menit' },
              { label: 'SpO₂', nilai: String(skrining.spo2), satuan: '%' },
          ]
        : [];

    return (
        <PasienAppLayout
            active="none"
            title="Detail konsultasi"
            description="Lihat status permintaan, hasil skrining perawat, keputusan dokter spesialis, dan percakapan konsultasi Anda."
        >
            <Head title={`Detail konsultasi ${data.nomor}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/pasien/riwayat"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke riwayat
                </Link>
                <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                    {data.nomor}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="status-konsultasi" className={cn('overflow-hidden rounded-[26px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-12 -right-8 size-40 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                        {statusLabel}
                                    </span>
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        {mode === 'video' ? (
                                            <Video className="size-3.5" aria-hidden="true" />
                                        ) : (
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                        )}
                                        {modeLabel}
                                    </span>
                                </div>

                                <h2 id="status-konsultasi" className="text-tk-deep mt-4 text-2xl leading-tight font-extrabold">
                                    {data.status === 'SELESAI' ? 'Konsultasi selesai' : statusLabel}
                                </h2>
                                <p className="text-tk-deep/75 mt-1 text-xs">
                                    {data.tanggal} · {data.dokter}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-tk-deep text-tk-mint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold">
                                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                                        {hasil === null ? 'Menunggu hasil dokter' : hasil.keputusanRujuk ? 'Dirujuk ke RS' : 'Rujukan terhindarkan'}
                                    </span>
                                    {hasil && (
                                        <span className="text-tk-deep inline-flex items-center rounded-full bg-white/25 px-3 py-1.5 text-[10px] font-bold">
                                            {hasil.icd10Kode} · {hasil.icd10Nama}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6" aria-label="Progres konsultasi">
                                {langkahKonsultasi.map((langkah, index) => {
                                    const selesai = index < progres.selesai;
                                    const aktif = progres.aktif === index && !selesai;
                                    const gagal = progres.gagal === index;
                                    const peringatan = progres.peringatan === index && !gagal;

                                    return (
                                        <li key={langkah} className="flex flex-col items-center gap-1.5 text-center">
                                            <span
                                                aria-label={`${langkah}: ${
                                                    selesai
                                                        ? 'selesai'
                                                        : gagal
                                                          ? 'terhenti'
                                                          : peringatan
                                                            ? 'perlu dijadwalkan ulang'
                                                            : aktif
                                                              ? 'sedang berjalan'
                                                              : 'menunggu'
                                                }`}
                                                className={cn(
                                                    'grid size-7 place-items-center rounded-full',
                                                    selesai &&
                                                        'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
                                                    aktif &&
                                                        'border-tk-green-500/50 text-tk-green-500 dark:border-tk-accent/60 dark:text-tk-accent border-[1.5px]',
                                                    peringatan && 'bg-tk-warning/15 text-tk-warning',
                                                    gagal && 'bg-tk-danger/15 text-tk-danger',
                                                    !selesai && !aktif && !peringatan && !gagal && 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                                )}
                                            >
                                                {selesai ? (
                                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                ) : gagal ? (
                                                    <X className="size-3.5" aria-hidden="true" />
                                                ) : aktif || peringatan ? (
                                                    <Clock className="size-3.5" aria-hidden="true" />
                                                ) : (
                                                    <Circle className="size-3" aria-hidden="true" />
                                                )}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[9px] leading-tight font-semibold',
                                                    selesai || aktif ? 'text-[var(--tk-text)]' : 'text-[var(--tk-muted)]',
                                                    peringatan && 'text-tk-warning',
                                                    gagal && 'text-tk-danger',
                                                )}
                                            >
                                                {langkah}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </section>

                    <section aria-labelledby="data-skrining" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Skrining perawat</p>
                                <h2 id="data-skrining" className="mt-1 text-[17px] font-bold">
                                    Data klinis awal
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {skrining ? `Diisi ${skrining.perawat} · ${skrining.waktu}` : 'Belum ada data skrining dari perawat'}
                                </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                <Lock className="size-3" aria-hidden="true" />
                                Read-only
                            </span>
                        </div>

                        {skrining ? (
                            <>
                                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {tandaVital.map((item) => (
                                        <div key={item.label} className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                            <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                {item.label}
                                            </dt>
                                            <dd className="mt-1.5 text-sm font-bold">
                                                {item.nilai}
                                                <span className="ml-1 text-[9px] font-medium text-[var(--tk-muted)]">{item.satuan}</span>
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                <div
                                    className={cn(
                                        'mt-3 flex items-start gap-2.5 rounded-2xl p-3.5',
                                        skrining.tandaBahaya ? 'bg-tk-danger/10' : 'bg-tk-green-500/[0.08]',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'grid size-8 shrink-0 place-items-center rounded-full',
                                            skrining.tandaBahaya
                                                ? 'bg-tk-danger/15 text-tk-danger'
                                                : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                        )}
                                    >
                                        {skrining.tandaBahaya ? (
                                            <Info className="size-4" aria-hidden="true" />
                                        ) : (
                                            <ShieldCheck className="size-4" aria-hidden="true" />
                                        )}
                                    </span>
                                    <div>
                                        <p className={cn('text-[11px] font-bold', skrining.tandaBahaya ? 'text-tk-danger' : 'text-[var(--tk-text)]')}>
                                            {skrining.tandaBahaya ? 'Tanda bahaya terdeteksi' : 'Tidak ada tanda bahaya'}
                                        </p>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            {skrining.tandaBahaya
                                                ? 'Pasien diprioritaskan untuk evaluasi dokter dan kemungkinan rujukan segera.'
                                                : 'Hasil triase otomatis tidak menemukan kondisi yang memerlukan rujukan gawat darurat.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Catatan perawat</p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{skrining.catatan || 'Tidak ada catatan tambahan.'}</p>
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Data skrining belum tersedia. Perawat akan mengisi berat, tinggi, tekanan darah, suhu, nadi, dan SpO₂ sebelum
                                konsultasi diteruskan ke dokter spesialis.
                            </p>
                        )}

                        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Data skrining hanya dapat diubah oleh perawat. Pasien melihat data ini sebagai referensi.
                        </p>
                    </section>

                    <section aria-labelledby="hasil-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                <FileText className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Hasil konsultasi</p>
                                <h2 id="hasil-konsultasi" className="mt-1 text-[17px] font-bold">
                                    Keputusan dokter spesialis
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {hasil ? `${data.dokter} · ${hasil.waktu}` : 'Menunggu dokter mengisi hasil konsultasi'}
                                </p>
                            </div>
                        </div>

                        {hasil ? (
                            <>
                                <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Diagnosis ICD-10</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="bg-tk-deep text-tk-mint rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold">
                                            {hasil.icd10Kode}
                                        </span>
                                        <p className="text-sm font-bold">{hasil.icd10Nama}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Saran dokter</p>
                                    <p className="mt-1.5 text-[11px] leading-relaxed">{hasil.saran}</p>
                                </div>

                                <KeputusanRujukBanner
                                    keputusanRujuk={hasil.keputusanRujuk}
                                    alasanRujuk={hasil.alasanRujuk}
                                    biayaRujukan={hasil.biayaRujukan}
                                    konteks="pasien"
                                    className="mt-4"
                                />

                                {!hasil.keputusanRujuk && (
                                    <ResepObatCard resep={resepTersimpan} judul="Obat dari puskesmas" selaluTampil className="mt-4" />
                                )}

                                <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Tindak lanjut puskesmas
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{hasil.tindakLanjut}</p>
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hasil konsultasi belum diisi. Setelah dokter spesialis menyelesaikan konsultasi, diagnosis ICD-10, saran, dan
                                keputusan rujuk akan tampil di sini.
                            </p>
                        )}
                    </section>

                    <section aria-labelledby="ruang-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Percakapan</p>
                                <h2 id="ruang-konsultasi" className="mt-1 text-[17px] font-bold">
                                    Ruang konsultasi
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {semuaPesan.length} pesan · {modeLabel}
                                </p>
                            </div>
                            <ConnectionBadge status={koneksi.status} />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Pilih mode konsultasi">
                            <button
                                type="button"
                                onClick={() => gantiMode('video')}
                                aria-pressed={mode === 'video'}
                                className={cn(
                                    'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold transition-colors',
                                    mode === 'video'
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                )}
                            >
                                <Video className="size-3.5" aria-hidden="true" />
                                Standar (video + chat)
                            </button>
                            <button
                                type="button"
                                onClick={() => gantiMode('teks')}
                                aria-pressed={mode === 'teks'}
                                className={cn(
                                    'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold transition-colors',
                                    mode === 'teks'
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                )}
                            >
                                <MessageSquare className="size-3.5" aria-hidden="true" />
                                Koneksi rendah (teks + foto)
                            </button>
                        </div>

                        {info && (
                            <p className="bg-tk-info/10 text-tk-info mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[10px] leading-relaxed">
                                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                {info}
                            </p>
                        )}

                        {mode === 'video' ? (
                            tautanVideo ? (
                                <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Sesi video · Google Meet
                                    </p>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Tautan dikirim oleh dokter spesialis. Tekan Gabung video untuk memulai konsultasi.
                                    </p>
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            readOnly
                                            value={tautanVideo}
                                            aria-label="Tautan video konsultasi"
                                            className="h-10 w-full rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page)] font-mono text-[10px]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={salinTautan}
                                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--tk-glass)] px-3 text-[10px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                            >
                                                <Copy className="size-3.5" aria-hidden="true" />
                                                {tersalin ? 'Tersalin' : 'Salin'}
                                            </button>
                                            <a
                                                href={tautanVideo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-bold transition-colors"
                                            >
                                                <ExternalLink className="size-3.5" aria-hidden="true" />
                                                Gabung video
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Sesi video · Google Meet
                                    </p>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Dokter spesialis belum mengirim tautan video. Anda tetap dapat berkomunikasi lewat chat di bawah.
                                    </p>
                                </div>
                            )
                        ) : (
                            alasanMode && (
                                <div className="bg-tk-warning/10 mt-4 flex items-start gap-2.5 rounded-2xl p-3.5">
                                    <Wifi className="text-tk-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        <span className="font-bold text-[var(--tk-text)]">Mode koneksi rendah aktif.</span> {alasanMode}
                                    </p>
                                </div>
                            )
                        )}

                        {penyimpananPenuh && (
                            <p className="bg-tk-warning/10 mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <AlertTriangle className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Penyimpanan perangkat penuh. Pesan terbaru hanya bertahan selama sesi ini.
                            </p>
                        )}

                        <div ref={ujungChat} className="mt-4 max-h-[440px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
                            {semuaPesan.length === 0 ? (
                                <p className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-center text-[10px] text-[var(--tk-muted)]">
                                    Belum ada pesan pada ruang konsultasi ini.
                                </p>
                            ) : (
                                semuaPesan.map((pesan) => {
                                    const dariPasien = pesan.pengirim === 'pasien';

                                    return (
                                        <div key={pesan.id} className={cn('flex', dariPasien && 'justify-end')}>
                                            <div
                                                className={cn(
                                                    'max-w-[85%] rounded-2xl px-4 py-3',
                                                    dariPasien
                                                        ? 'bg-tk-accent text-tk-deep rounded-br-md'
                                                        : 'rounded-bl-md bg-[var(--tk-page-alt)] text-[var(--tk-text)]',
                                                )}
                                            >
                                                <p
                                                    className={cn(
                                                        'text-[9px] font-semibold',
                                                        dariPasien ? 'text-tk-deep/65' : 'text-[var(--tk-muted)]',
                                                    )}
                                                >
                                                    {labelPengirim[pesan.pengirim]} · {pesan.waktu}
                                                    {pesan.statusKirim === 'MENUNGGU' && ' · Menunggu kirim'}
                                                </p>
                                                {pesan.foto && (
                                                    <img
                                                        src={sumberFoto(pesan.foto)}
                                                        alt="Lampiran foto konsultasi"
                                                        className="mt-2 max-h-56 w-full rounded-xl object-cover"
                                                    />
                                                )}
                                                <p className="mt-1 text-[11px] leading-relaxed">{pesan.isi}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {bisaChat ? (
                            <>
                                <form onSubmit={kirimPesan} className="mt-4 border-t border-[var(--tk-glass-border)] pt-4">
                                    {fotoLampiran && (
                                        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--tk-page-alt)] p-2">
                                            <img src={fotoLampiran} alt="Pratinjau foto terkompres" className="size-14 rounded-lg object-cover" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-semibold">Foto siap dikirim</p>
                                                <p className="text-[9px] text-[var(--tk-muted)]">Dikompres otomatis · maksimal ±200 KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFotoLampiran(null)}
                                                aria-label="Hapus foto lampiran"
                                                className="text-tk-muted grid size-8 shrink-0 place-items-center rounded-full hover:bg-[var(--tk-glass)] hover:text-[var(--tk-text)]"
                                            >
                                                <X className="size-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            id={`lampiran-pasien-${data.id}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={pilihFoto}
                                            className="sr-only"
                                            disabled={memprosesFoto}
                                        />
                                        <label
                                            htmlFor={`lampiran-pasien-${data.id}`}
                                            aria-label="Lampirkan foto"
                                            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--tk-glass-border)] text-[var(--tk-muted)] transition-colors hover:bg-[var(--tk-page-alt)] hover:text-[var(--tk-text)]"
                                        >
                                            <ImagePlus className={cn('size-4', memprosesFoto && 'animate-pulse')} aria-hidden="true" />
                                        </label>
                                        <Input
                                            value={pesanBaru}
                                            onChange={(event) => {
                                                setPesanBaru(event.target.value);
                                                setErrorPesan(undefined);
                                            }}
                                            placeholder="Tulis pesan tindak lanjut..."
                                            aria-label="Tulis pesan tindak lanjut"
                                            aria-invalid={Boolean(errorPesan)}
                                            className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] text-xs text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={mengirim || memprosesFoto || (!pesanBaru.trim() && !fotoLampiran)}
                                            aria-label="Kirim pesan"
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            <Send className={cn('size-4', mengirim && 'animate-pulse')} aria-hidden="true" />
                                        </button>
                                    </div>
                                    <InputError message={errorPesan} className="text-tk-danger mt-2 text-[10px]" />
                                </form>

                                <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                    {koneksi.status === 'offline'
                                        ? 'Anda sedang offline. Pesan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.'
                                        : 'Ruang chat tetap terbuka untuk tindak lanjut. Foto otomatis dikompres sebelum dikirim.'}
                                </p>
                            </>
                        ) : (
                            <p className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Ruang chat terbuka setelah dokter spesialis ditentukan. Lengkapi skrining di puskesmas terlebih dahulu.
                            </p>
                        )}
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="dokter-penanggung-jawab" className={cn('rounded-[24px] p-5', glass)}>
                        <p id="dokter-penanggung-jawab" className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                            Dokter penanggung jawab
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-tk-mint grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[12px] font-extrabold">
                                {inisial(data.dokter, true)}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold">{data.dokter}</p>
                                <p className="text-tk-green-500 dark:text-tk-accent text-[10px] font-semibold">Spesialis {data.spesialisasi}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                    {data.faskes}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.jadwal}</p>
                        </div>
                    </section>

                    <section aria-labelledby="ringkasan-detail" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="ringkasan-detail" className="text-[15px] font-bold">
                            Ringkasan
                        </h2>

                        <dl className="mt-4 grid gap-3 text-[11px]">
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Nomor</dt>
                                <dd className="text-right font-semibold">{data.nomor}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Tanggal</dt>
                                <dd className="text-right font-semibold">{data.tanggalSingkat}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Status</dt>
                                <dd className="text-tk-green-500 dark:text-tk-accent text-right font-semibold">{statusLabel}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Mode</dt>
                                <dd className="text-right font-semibold">{modeLabel}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Keputusan</dt>
                                <dd
                                    className={cn(
                                        'text-right font-semibold',
                                        hasil === null
                                            ? 'text-[var(--tk-muted)]'
                                            : hasil.keputusanRujuk
                                              ? 'text-tk-warning'
                                              : 'text-tk-green-500 dark:text-tk-accent',
                                    )}
                                >
                                    {hasil === null ? 'Menunggu hasil' : hasil.keputusanRujuk ? 'Dirujuk' : 'Tidak dirujuk'}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Keluhan</dt>
                                <dd className="max-w-[18ch] text-right font-semibold">{data.keluhan}</dd>
                            </div>
                        </dl>

                        <Link
                            href="/pasien/konsultasi/baru"
                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-4 text-[11px] font-bold transition-colors"
                        >
                            Ajukan konsultasi baru
                            <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </section>

                    <section aria-label="Informasi tindak lanjut" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'grid size-9 shrink-0 place-items-center rounded-full',
                                    hasil === null
                                        ? 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]'
                                        : hasil.keputusanRujuk
                                          ? 'bg-tk-warning/15 text-tk-warning'
                                          : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                )}
                            >
                                {hasil === null ? (
                                    <Clock className="size-4" aria-hidden="true" />
                                ) : hasil.keputusanRujuk ? (
                                    <MapPin className="size-4" aria-hidden="true" />
                                ) : (
                                    <Stethoscope className="size-4" aria-hidden="true" />
                                )}
                            </span>
                            <div>
                                <p className="text-[11px] font-bold">
                                    {hasil === null ? 'Menunggu tindak lanjut' : hasil.keputusanRujuk ? 'Rujukan tercatat' : 'Tetap di puskesmas'}
                                </p>
                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    {hasil === null
                                        ? 'Tindak lanjut akan muncul setelah dokter spesialis mengisi hasil konsultasi.'
                                        : hasil.tindakLanjut}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section aria-label="Privasi data" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-9 shrink-0 place-items-center rounded-full">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Data konsultasi Anda</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hanya Anda dan tim kesehatan yang menangani yang dapat melihat detail konsultasi ini.
                            </p>
                        </div>
                    </section>

                    <section aria-label="Waktu konsultasi" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                            <Clock className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Waktu konsultasi</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                {hasil
                                    ? `Sesi berlangsung sekitar 35 menit. Hasil dicatat pada ${hasil.waktu}.`
                                    : 'Waktu pencatatan hasil akan muncul setelah dokter menyelesaikan konsultasi.'}
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
