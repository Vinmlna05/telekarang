import type { PengirimPesan } from '@/data/konsultasi-pasien';

export interface PesanChatLokal {
    id: number;
    pengirim: PengirimPesan;
    isi: string;
    waktu: string;
    foto?: string | null;
    statusKirim?: 'TERKIRIM' | 'MENUNGGU';
}

function isPesanChat(nilai: unknown): nilai is PesanChatLokal {
    if (typeof nilai !== 'object' || nilai === null) {
        return false;
    }

    const item = nilai as Partial<PesanChatLokal>;

    return (
        typeof item.id === 'number' &&
        (item.pengirim === 'pasien' || item.pengirim === 'perawat' || item.pengirim === 'spesialis') &&
        typeof item.isi === 'string' &&
        typeof item.waktu === 'string'
    );
}

export function bacaPesanLokal<T extends PesanChatLokal>(kunci: string): T[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const mentah = window.localStorage.getItem(kunci);

        if (!mentah) {
            return [];
        }

        const parsed: unknown = JSON.parse(mentah);

        return Array.isArray(parsed) ? (parsed.filter(isPesanChat) as T[]) : [];
    } catch {
        return [];
    }
}

export function simpanPesanLokal(kunci: string, daftar: PesanChatLokal[]): boolean {
    try {
        window.localStorage.setItem(kunci, JSON.stringify(daftar));

        return true;
    } catch {
        return false;
    }
}

export function kompresGambar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const pembaca = new FileReader();

        pembaca.onerror = () => reject(new Error('Gagal membaca berkas.'));
        pembaca.onload = () => {
            const gambar = new Image();

            gambar.onerror = () => reject(new Error('Gagal memuat gambar.'));
            gambar.onload = () => {
                const skala = Math.min(1, 1024 / Math.max(gambar.width, gambar.height));
                const kanvas = document.createElement('canvas');
                kanvas.width = Math.max(1, Math.round(gambar.width * skala));
                kanvas.height = Math.max(1, Math.round(gambar.height * skala));

                const konteks = kanvas.getContext('2d');

                if (!konteks) {
                    reject(new Error('Kanvas tidak tersedia.'));
                    return;
                }

                konteks.fillStyle = '#ffffff';
                konteks.fillRect(0, 0, kanvas.width, kanvas.height);
                konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);

                let kualitas = 0.8;
                let hasil = kanvas.toDataURL('image/jpeg', kualitas);

                while (hasil.length > 200 * 1024 && kualitas > 0.35) {
                    kualitas -= 0.1;
                    hasil = kanvas.toDataURL('image/jpeg', kualitas);
                }

                resolve(hasil);
            };
            gambar.src = String(pembaca.result);
        };
        pembaca.readAsDataURL(file);
    });
}
