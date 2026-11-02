export interface Icd10Item {
    kode: string;
    nama: string;
}

export const daftarIcd10: Icd10Item[] = [
    { kode: 'I10', nama: 'Hipertensi esensial (primer)' },
    { kode: 'J06.9', nama: 'Infeksi saluran napas atas akut' },
    { kode: 'A09', nama: 'Diare dan gastroenteritis' },
    { kode: 'L30.9', nama: 'Dermatitis, tidak dijelaskan' },
    { kode: 'K29.7', nama: 'Gastritis, tidak dijelaskan' },
    { kode: 'R50.9', nama: 'Demam, tidak dijelaskan' },
    { kode: 'N39.0', nama: 'Infeksi saluran kemih, lokasi tidak dijelaskan' },
    { kode: 'E11.9', nama: 'Diabetes melitus tipe 2 tanpa komplikasi' },
    { kode: 'J18.9', nama: 'Pneumonia, tidak dijelaskan' },
    { kode: 'J45.9', nama: 'Asma, tidak dijelaskan' },
    { kode: 'A91', nama: 'Demam berdarah dengue' },
    { kode: 'J00', nama: 'Nasofaringitis akut (common cold)' },
    { kode: 'J02.9', nama: 'Faringitis akut, tidak dijelaskan' },
    { kode: 'K30', nama: 'Dispepsia (nyeri lambung)' },
    { kode: 'L20.9', nama: 'Dermatitis atopik, tidak dijelaskan' },
    { kode: 'L50.9', nama: 'Urtikaria, tidak dijelaskan' },
    { kode: 'M54.5', nama: 'Nyeri punggung bawah' },
    { kode: 'M25.5', nama: 'Nyeri sendi' },
    { kode: 'R05', nama: 'Batuk' },
    { kode: 'R51', nama: 'Sakit kepala' },
    { kode: 'G43.9', nama: 'Migrain, tidak dijelaskan' },
    { kode: 'H10.9', nama: 'Konjungtivitis, tidak dijelaskan' },
    { kode: 'H66.9', nama: 'Otitis media, tidak dijelaskan' },
    { kode: 'I25.9', nama: 'Penyakit jantung iskemik kronik' },
    { kode: 'S93.4', nama: 'Terkilir pergelangan kaki' },
    { kode: 'Z00.0', nama: 'Pemeriksaan kesehatan umum' },
];
