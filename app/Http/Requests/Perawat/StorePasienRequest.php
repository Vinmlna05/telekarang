<?php

namespace App\Http\Requests\Perawat;

use App\Models\Pasien;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StorePasienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'perawat';
    }

    protected function prepareForValidation(): void
    {
        $data = collect($this->except(['password', 'password_confirmation']))
            ->map(fn (mixed $value) => is_string($value) ? trim($value) : $value)
            ->map(fn (mixed $value) => $value === '' ? null : $value)
            ->all();

        if (is_string($data['email'] ?? null)) {
            $data['email'] = Str::lower($data['email']);
        }

        $this->merge($data);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'min:3', 'max:255'],
            'nik' => ['required', 'digits:16', Rule::unique(Pasien::class, 'nik')],
            'tgl_lahir' => ['required', 'date', 'before_or_equal:today'],
            'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
            'alamat' => ['required', 'string', 'min:5', 'max:500'],
            'telepon' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\s-]+$/'],
            'punya_akun' => ['required', 'boolean'],
            'email' => [
                'exclude_unless:punya_akun,true',
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'email'),
            ],
            'password' => [
                'exclude_unless:punya_akun,true',
                'required',
                'string',
                'confirmed',
                Password::defaults(),
            ],
            'password_confirmation' => [
                'exclude_unless:punya_akun,true',
                'required',
                'string',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama.required' => 'Nama lengkap wajib diisi.',
            'nama.min' => 'Nama minimal 3 karakter.',
            'nik.required' => 'NIK wajib diisi.',
            'nik.digits' => 'NIK harus 16 digit angka.',
            'nik.unique' => 'NIK sudah terdaftar.',
            'tgl_lahir.required' => 'Tanggal lahir wajib diisi.',
            'tgl_lahir.before_or_equal' => 'Tanggal lahir tidak boleh melewati hari ini.',
            'jenis_kelamin.required' => 'Jenis kelamin wajib dipilih.',
            'alamat.required' => 'Alamat wajib diisi.',
            'alamat.min' => 'Alamat minimal 5 karakter.',
            'telepon.required' => 'Nomor telepon wajib diisi.',
            'telepon.regex' => 'Nomor telepon tidak valid.',
            'email.required' => 'Email wajib diisi jika membuat akun pasien.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah dipakai akun lain.',
            'password.required' => 'Kata sandi wajib diisi jika membuat akun pasien.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak sama.',
            'password_confirmation.required' => 'Konfirmasi kata sandi wajib diisi.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nama' => 'nama lengkap',
            'nik' => 'NIK',
            'tgl_lahir' => 'tanggal lahir',
            'jenis_kelamin' => 'jenis kelamin',
            'alamat' => 'alamat',
            'telepon' => 'nomor telepon',
            'email' => 'email',
            'password' => 'kata sandi',
            'password_confirmation' => 'konfirmasi kata sandi',
        ];
    }
}
