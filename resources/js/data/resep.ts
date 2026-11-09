export interface ItemResep {
    id: number;
    namaObat: string;
    dosis: string;
    rute: string;
    frekuensi: string;
    durasi: string;
    jumlah: string;
    instruksi?: string;
}

export interface Resep {
    konsultasiId: number;
    perluObat: boolean;
    items: ItemResep[];
    catatan?: string;
}

export const ruteObat = ['Oral', 'IV', 'IM', 'Topikal', 'Inhalasi', 'Lainnya'];

export const contohDosisObat = ['500 mg', '3×1 tablet', '1 sendok teh', '5 ml', '1 ampul'];

export function itemResepBaru(id: number): ItemResep {
    return {
        id,
        namaObat: '',
        dosis: '',
        rute: 'Oral',
        frekuensi: '',
        durasi: '',
        jumlah: '',
        instruksi: '',
    };
}

export function resepKosong(konsultasiId: number): Resep {
    return {
        konsultasiId,
        perluObat: false,
        items: [],
        catatan: '',
    };
}

export function jumlahItemResep(resep: Resep | null | undefined): number {
    return resep?.items.length ?? 0;
}

export function ringkasResep(resep: Resep | null | undefined): string {
    if (!resep || !resep.perluObat || resep.items.length === 0) {
        return 'Tanpa resep obat.';
    }

    return resep.items.map((item) => `${item.namaObat} ${item.dosis} (${item.frekuensi}, ${item.durasi})`).join('; ');
}
