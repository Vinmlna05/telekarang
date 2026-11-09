<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DokterController extends Controller
{
    /**
     * Daftar data dokter beserta ringkasan dan pilihan akun staff.
     */
    public function index(Request $request): Response
    {
        $q = trim($request->string('q')->toString());
        $peran = $request->string('peran')->toString();
        $peran = in_array($peran, Dokter::PERAN, true) ? $peran : '';
        $spesialisasi = trim($request->string('spesialisasi')->toString());

        $daftar = Dokter::query()
            ->with('user:id,name,email,role')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($query) use ($q) {
                    $query->where('nama', 'like', "%{$q}%")
                        ->orWhere('faskes', 'like', "%{$q}%")
                        ->orWhere('spesialisasi', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($query) => $query->where('email', 'like', "%{$q}%"));
                });
            })
            ->when($peran !== '', fn ($query) => $query->where('peran', $peran))
            ->when($spesialisasi !== '', fn ($query) => $query->where('spesialisasi', $spesialisasi))
            ->orderByRaw("case peran when 'umum' then 0 else 1 end")
            ->orderBy('nama')
            ->get()
            ->map(fn (Dokter $dokter) => [
                'id' => $dokter->id,
                'user_id' => $dokter->user_id,
                'nama' => $dokter->nama,
                'email' => $dokter->user?->email,
                'peran' => $dokter->peran,
                'spesialisasi' => $dokter->spesialisasi,
                'faskes' => $dokter->faskes,
                'status' => $dokter->status,
            ]);

        $tertaut = Dokter::query()->pluck('user_id');

        $akun = User::query()
            ->whereIn('role', ['dokter_umum', 'spesialis'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tertaut' => $tertaut->contains($user->id),
            ]);

        return Inertia::render('admin/dokter', [
            'dokter' => $daftar,
            'ringkasan' => [
                'total' => Dokter::query()->count(),
                'umum' => Dokter::query()->where('peran', 'umum')->count(),
                'spesialis' => Dokter::query()->where('peran', 'spesialis')->count(),
                'belumLengkap' => Dokter::query()
                    ->where('peran', 'spesialis')
                    ->where(fn ($query) => $query->whereNull('spesialisasi')->orWhere('spesialisasi', ''))
                    ->count(),
            ],
            'filters' => [
                'q' => $q,
                'peran' => $peran,
                'spesialisasi' => $spesialisasi,
            ],
            'akun' => $akun,
        ]);
    }

    /**
     * Simpan profil dokter baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        $dokter = Dokter::query()->create($validated);

        AuditLog::catat(
            $request->user(),
            'membuat',
            'dokter',
            (string) $dokter->id,
            "Menambahkan profil dokter {$dokter->nama}.",
        );

        return to_route('admin.dokter')
            ->with('success', "Data dokter {$validated['nama']} berhasil ditambahkan.");
    }

    /**
     * Perbarui profil dokter.
     */
    public function update(Request $request, Dokter $dokter): RedirectResponse
    {
        $validated = $this->validated($request, $dokter);

        $dokter->update($validated);

        AuditLog::catat(
            $request->user(),
            'mengubah',
            'dokter',
            (string) $dokter->id,
            "Memperbarui profil dokter {$dokter->nama}.",
        );

        return to_route('admin.dokter')
            ->with('success', "Data dokter {$dokter->nama} berhasil diperbarui.");
    }

    /**
     * Validasi data dokter dengan aturan yang sama untuk tambah dan ubah.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Dokter $dokter = null): array
    {
        $validated = $request->validate([
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(fn ($query) => $query->whereIn('role', ['dokter_umum', 'spesialis'])),
                Rule::unique('dokter', 'user_id')->ignore($dokter?->id),
            ],
            'nama' => ['required', 'string', 'max:255'],
            'peran' => ['required', 'string', Rule::in(Dokter::PERAN)],
            'spesialisasi' => ['nullable', 'string', 'max:255', 'required_if:peran,spesialis'],
            'faskes' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::in(Dokter::STATUS)],
        ], [
            'user_id.required' => 'Pilih akun dokter terlebih dahulu.',
            'user_id.exists' => 'Akun yang dipilih bukan akun dokter.',
            'user_id.unique' => 'Akun ini sudah memiliki profil dokter.',
            'nama.required' => 'Nama dokter wajib diisi.',
            'peran.required' => 'Pilih peran dokter.',
            'peran.in' => 'Peran dokter tidak valid.',
            'spesialisasi.required_if' => 'Spesialisasi wajib dipilih untuk dokter spesialis.',
            'faskes.required' => 'Faskes wajib dipilih.',
            'status.required' => 'Pilih status dokter.',
            'status.in' => 'Status dokter tidak valid.',
        ]);

        if ($validated['peran'] === 'umum') {
            $validated['spesialisasi'] = null;
        }

        return $validated;
    }
}
