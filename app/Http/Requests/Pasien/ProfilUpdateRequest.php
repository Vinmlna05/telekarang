<?php

namespace App\Http\Requests\Pasien;

use App\Models\Pasien;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfilUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'pasien';
    }

    /**
     * Normalisasi input kosong menjadi null.
     */
    protected function prepareForValidation(): void
    {
        $data = collect($this->all())
            ->map(fn (mixed $value) => is_string($value) ? trim($value) : $value)
            ->map(fn (mixed $value) => $value === '' ? null : $value)
            ->all();

        $this->merge($data);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $pasienId = Pasien::query()
            ->where('user_id', $this->user()->id)
            ->value('id');

        return [
            'nik' => [
                'nullable',
                'string',
                'max:32',
                Rule::unique(Pasien::class, 'nik')->ignore($pasienId),
            ],
            'tgl_lahir' => ['nullable', 'date', 'before_or_equal:today'],
            'jenis_kelamin' => ['nullable', Rule::in(['Laki-laki', 'Perempuan'])],
            'telepon' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\s-]+$/'],
            'alamat' => ['nullable', 'string', 'max:500'],
            'golongan_darah' => ['nullable', Rule::in(['A', 'B', 'AB', 'O', 'TIDAK_DIKETAHUI'])],
            'alergi' => ['nullable', 'string', 'max:1000'],
            'obat_rutin' => ['nullable', 'string', 'max:1000'],
            'kontak_darurat_nama' => ['nullable', 'string', 'max:255'],
            'kontak_darurat_hubungan' => ['nullable', 'string', 'max:50', 'required_with:kontak_darurat_nama'],
            'kontak_darurat_telepon' => [
                'nullable',
                'string',
                'max:30',
                'regex:/^[0-9+()\s-]+$/',
                'required_with:kontak_darurat_nama',
            ],
        ];
    }

    /**
     * Pesan validasi dalam bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nik.unique' => 'NIK sudah terdaftar. Hubungi petugas puskesmas untuk menautkan akun Anda.',
            'nik.max' => 'NIK terlalu panjang.',
            'tgl_lahir.before_or_equal' => 'Tanggal lahir tidak boleh melewati hari ini.',
            'telepon.regex' => 'Nomor telepon hanya boleh berisi angka, spasi, tanda +, -, atau kurung.',
            'kontak_darurat_telepon.regex' => 'Nomor kontak darurat tidak valid.',
            'kontak_darurat_hubungan.required_with' => 'Hubungan kontak darurat wajib diisi.',
            'kontak_darurat_telepon.required_with' => 'Nomor telepon kontak darurat wajib diisi.',
        ];
    }

    /**
     * Nama atribut yang ditampilkan pada pesan validasi.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nik' => 'NIK',
            'tgl_lahir' => 'tanggal lahir',
            'jenis_kelamin' => 'jenis kelamin',
            'telepon' => 'nomor telepon',
            'alamat' => 'alamat',
            'golongan_darah' => 'golongan darah',
            'alergi' => 'alergi',
            'obat_rutin' => 'obat rutin',
            'kontak_darurat_nama' => 'nama kontak darurat',
            'kontak_darurat_hubungan' => 'hubungan kontak darurat',
            'kontak_darurat_telepon' => 'telepon kontak darurat',
        ];
    }
}
