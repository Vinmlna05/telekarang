import type { ItemResep, Resep } from './resep';

export interface HasilSpesialisTersimpan {
    konsultasiId: number;
    kodeIcd: string;
    namaIcd: string;
    saran: string;
    keputusanRujuk: boolean;
    alasanRujuk: string | null;
    biayaRujukan: number | null;
    ringkasanPasien: string | null;
    waktu: string;
    resep: Resep | null;
}

export function kunciHasilSpesialis(id: number): string {
    return `telekarang:hasil-spesialis:${id}`;
}

function bacaItemResep(nilai: unknown): ItemResep | null {
    if (!nilai || typeof nilai !== 'object') {
        return null;
    }

    const item = nilai as Record<string, unknown>;

    if (typeof item.id !== 'number' || typeof item.namaObat !== 'string' || item.namaObat.trim().length === 0) {
        return null;
    }

    return {
        id: item.id,
        namaObat: item.namaObat,
        dosis: typeof item.dosis === 'string' ? item.dosis : '',
        rute: typeof item.rute === 'string' ? item.rute : 'Oral',
        frekuensi: typeof item.frekuensi === 'string' ? item.frekuensi : '',
        durasi: typeof item.durasi === 'string' ? item.durasi : '',
        jumlah: typeof item.jumlah === 'string' ? item.jumlah : '',
        instruksi: typeof item.instruksi === 'string' ? item.instruksi : '',
    };
}

function bacaResep(nilai: unknown, konsultasiId: number): Resep | null {
    if (!nilai || typeof nilai !== 'object') {
        return null;
    }

    const resep = nilai as Record<string, unknown>;
    const items = Array.isArray(resep.items) ? resep.items.map(bacaItemResep).filter((item): item is ItemResep => item !== null) : [];

    return {
        konsultasiId: typeof resep.konsultasiId === 'number' ? resep.konsultasiId : konsultasiId,
        perluObat: resep.perluObat === true,
        items,
        catatan: typeof resep.catatan === 'string' ? resep.catatan : '',
    };
}

export function bacaHasilSpesialis(id: number): HasilSpesialisTersimpan | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciHasilSpesialis(id));

        if (!mentah) {
            return null;
        }

        const parsed: unknown = JSON.parse(mentah);

        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const obj = parsed as Record<string, unknown>;

        if (typeof obj.kodeIcd !== 'string' || typeof obj.namaIcd !== 'string' || typeof obj.saran !== 'string') {
            return null;
        }

        return {
            konsultasiId: typeof obj.konsultasiId === 'number' ? obj.konsultasiId : id,
            kodeIcd: obj.kodeIcd,
            namaIcd: obj.namaIcd,
            saran: obj.saran,
            keputusanRujuk: obj.keputusanRujuk === true,
            alasanRujuk: typeof obj.alasanRujuk === 'string' ? obj.alasanRujuk : null,
            biayaRujukan: typeof obj.biayaRujukan === 'number' ? obj.biayaRujukan : null,
            ringkasanPasien: typeof obj.ringkasanPasien === 'string' ? obj.ringkasanPasien : null,
            waktu: typeof obj.waktu === 'string' ? obj.waktu : '',
            resep: bacaResep(obj.resep, id),
        };
    } catch {
        return null;
    }
}

export function simpanHasilSpesialis(hasil: HasilSpesialisTersimpan): boolean {
    try {
        window.localStorage.setItem(kunciHasilSpesialis(hasil.konsultasiId), JSON.stringify(hasil));

        return true;
    } catch {
        return false;
    }
}
