export type PeranNotifikasi = 'perawat' | 'pasien' | 'dokter_umum';

export type TipeNotifikasi = 'HASIL_SPESIALIS' | 'RESEP_OBAT' | 'RUJUKAN' | 'TIDAK_DIRUJUK' | 'OBAT_DIBERIKAN';

export interface NotifikasiItem {
    id: string;
    untuk: PeranNotifikasi;
    tipe: TipeNotifikasi;
    judul: string;
    isi: string;
    url: string;
    dibaca: boolean;
    waktu: string;
}

const KUNCI_PREFIX = 'telekarang:notifikasi:';
const EVENT_NOTIFIKASI = 'telekarang:notifikasi-changed';

function kunciNotifikasi(peran: PeranNotifikasi): string {
    return `${KUNCI_PREFIX}${peran}`;
}

function isoMenitLalu(menit: number): string {
    return new Date(Date.now() - menit * 60_000).toISOString();
}

export const notifikasiAwal: Record<PeranNotifikasi, NotifikasiItem[]> = {
    perawat: [
        {
            id: 'seed-perawat-hasil-1',
            untuk: 'perawat',
            tipe: 'HASIL_SPESIALIS',
            judul: 'Hasil konsultasi baru',
            isi: 'dr. Ayu Lestari, Sp.A mengirim hasil untuk Siti Rahmawati. Tidak dirujuk, ada resep obat yang perlu diberikan.',
            url: '/perawat/tindak-lanjut/1',
            dibaca: false,
            waktu: isoMenitLalu(12),
        },
        {
            id: 'seed-perawat-rujukan-8',
            untuk: 'perawat',
            tipe: 'RUJUKAN',
            judul: 'Pasien perlu dirujuk',
            isi: 'Paulus Rumbewas perlu dirujuk ke RSUD Daratan. Siapkan transportasi dan proses rujukan.',
            url: '/perawat/tindak-lanjut/8',
            dibaca: false,
            waktu: isoMenitLalu(95),
        },
        {
            id: 'seed-perawat-hasil-3',
            untuk: 'perawat',
            tipe: 'HASIL_SPESIALIS',
            judul: 'Tindak lanjut sudah dicatat',
            isi: 'Hasil konsultasi Maria Lestari sudah ditindaklanjuti di puskesmas.',
            url: '/perawat/konsultasi/3',
            dibaca: true,
            waktu: isoMenitLalu(60 * 26),
        },
    ],
    pasien: [
        {
            id: 'seed-pasien-tidak-rujuk-1',
            untuk: 'pasien',
            tipe: 'TIDAK_DIRUJUK',
            judul: 'Anda tidak perlu dirujuk',
            isi: 'Hasil konsultasi ISPA: cukup dirawat di Puskesmas Pulau Karang. Ada resep obat yang bisa diambil di puskesmas.',
            url: '/pasien/konsultasi/1',
            dibaca: false,
            waktu: isoMenitLalu(18),
        },
        {
            id: 'seed-pasien-rujuk-3',
            untuk: 'pasien',
            tipe: 'RUJUKAN',
            judul: 'Anda dirujuk ke RS',
            isi: 'Dokter spesialis menyarankan rujukan ke RSUD Daratan. Perawat akan membantu proses keberangkatan.',
            url: '/pasien/konsultasi/3',
            dibaca: false,
            waktu: isoMenitLalu(60 * 5),
        },
        {
            id: 'seed-pasien-hasil-2',
            untuk: 'pasien',
            tipe: 'HASIL_SPESIALIS',
            judul: 'Hasil konsultasi tersedia',
            isi: 'Diagnosis, saran, dan keputusan rujukan konsultasi hipertensi Anda sudah dicatat.',
            url: '/pasien/konsultasi/2',
            dibaca: true,
            waktu: isoMenitLalu(60 * 24 * 3),
        },
    ],
    dokter_umum: [],
};

function salinAwal(peran: PeranNotifikasi): NotifikasiItem[] {
    return notifikasiAwal[peran].map((item) => ({ ...item }));
}

export function bacaNotifikasi(peran: PeranNotifikasi): NotifikasiItem[] {
    if (typeof window === 'undefined') {
        return salinAwal(peran);
    }

    try {
        const mentah = window.localStorage.getItem(kunciNotifikasi(peran));

        if (!mentah) {
            const awal = salinAwal(peran);
            window.localStorage.setItem(kunciNotifikasi(peran), JSON.stringify(awal));

            return awal;
        }

        const parsed: unknown = JSON.parse(mentah);

        if (!Array.isArray(parsed)) {
            return salinAwal(peran);
        }

        return parsed
            .filter((nilai): nilai is NotifikasiItem => {
                if (!nilai || typeof nilai !== 'object') {
                    return false;
                }

                const item = nilai as Partial<NotifikasiItem>;

                return (
                    typeof item.id === 'string' &&
                    typeof item.judul === 'string' &&
                    typeof item.isi === 'string' &&
                    typeof item.url === 'string' &&
                    typeof item.dibaca === 'boolean'
                );
            })
            .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
    } catch {
        return salinAwal(peran);
    }
}

function simpanNotifikasi(peran: PeranNotifikasi, daftar: NotifikasiItem[]): boolean {
    try {
        window.localStorage.setItem(kunciNotifikasi(peran), JSON.stringify(daftar));
        window.dispatchEvent(new CustomEvent(EVENT_NOTIFIKASI, { detail: { peran } }));

        return true;
    } catch {
        return false;
    }
}

export function tambahNotifikasi(peran: PeranNotifikasi, item: Omit<NotifikasiItem, 'untuk'>): void {
    if (typeof window === 'undefined') {
        return;
    }

    const daftar = bacaNotifikasi(peran);
    const tanpaDuplikat = daftar.filter((entri) => entri.id !== item.id);

    simpanNotifikasi(peran, [{ ...item, untuk: peran }, ...tanpaDuplikat]);
}

export function tandaiNotifikasiDibaca(peran: PeranNotifikasi, id: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    simpanNotifikasi(
        peran,
        bacaNotifikasi(peran).map((item) => (item.id === id ? { ...item, dibaca: true } : item)),
    );
}

export function tandaiSemuaNotifikasiDibaca(peran: PeranNotifikasi): void {
    if (typeof window === 'undefined') {
        return;
    }

    simpanNotifikasi(
        peran,
        bacaNotifikasi(peran).map((item) => ({ ...item, dibaca: true })),
    );
}

export function hitungNotifikasiBelumDibaca(peran: PeranNotifikasi): number {
    return bacaNotifikasi(peran).filter((item) => !item.dibaca).length;
}

export function formatWaktuNotifikasi(waktu: string): string {
    const tanggal = new Date(waktu);

    if (Number.isNaN(tanggal.getTime())) {
        return waktu;
    }

    const selisih = Date.now() - tanggal.getTime();

    if (selisih < 60_000) {
        return 'Baru saja';
    }

    if (selisih < 3_600_000) {
        return `${Math.floor(selisih / 60_000)} menit lalu`;
    }

    if (selisih < 86_400_000) {
        return `${Math.floor(selisih / 3_600_000)} jam lalu`;
    }

    if (selisih < 7 * 86_400_000) {
        return `${Math.floor(selisih / 86_400_000)} hari lalu`;
    }

    return tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const labelTipeNotifikasi: Record<TipeNotifikasi, string> = {
    HASIL_SPESIALIS: 'Hasil konsultasi',
    RESEP_OBAT: 'Resep obat',
    RUJUKAN: 'Rujukan',
    TIDAK_DIRUJUK: 'Rujukan terhindarkan',
    OBAT_DIBERIKAN: 'Obat diberikan',
};

export function urlNotifikasiPeran(peran: PeranNotifikasi): string {
    return peran === 'pasien' ? '/pasien/notifikasi' : '/perawat/notifikasi';
}
