<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PenggunaController extends Controller
{
    /**
     * Label peran yang dapat dipilih admin.
     *
     * @var array<string, string>
     */
    private const ROLE_LABELS = [
        'pasien' => 'Pasien',
        'perawat' => 'Perawat',
        'dokter_umum' => 'Dokter umum',
        'spesialis' => 'Dokter spesialis',
        'admin' => 'Admin',
    ];

    /**
     * Peran staff yang boleh didaftarkan langsung oleh admin.
     *
     * @var list<string>
     */
    private const STAFF_ROLES = ['perawat', 'dokter_umum', 'spesialis'];

    /**
     * Daftar pengguna dengan pencarian dan filter peran.
     */
    public function index(Request $request): Response
    {
        $role = $request->string('role')->toString();
        $role = array_key_exists($role, self::ROLE_LABELS) ? $role : '';
        $q = trim($request->string('q')->toString());

        $pengguna = User::query()
            ->select(['id', 'name', 'email', 'role', 'created_at'])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($query) use ($q) {
                    $query->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($role !== '', fn ($query) => $query->where('role', $role))
            ->orderByRaw("case role when 'admin' then 0 when 'perawat' then 1 when 'dokter_umum' then 2 when 'spesialis' then 3 else 4 end")
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/pengguna', [
            'pengguna' => $pengguna,
            'ringkasan' => [
                'total' => User::query()->count(),
                'staff' => User::query()->whereIn('role', self::STAFF_ROLES)->count(),
                'pasien' => User::query()->where('role', 'pasien')->count(),
                'admin' => User::query()->where('role', 'admin')->count(),
            ],
            'filters' => [
                'q' => $q,
                'role' => $role,
            ],
        ]);
    }

    /**
     * Registrasi akun staff baru oleh admin.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', 'string', Rule::in(self::STAFF_ROLES)],
            'spesialisasi' => ['nullable', 'string', Rule::in(Dokter::SPESIALISASI), 'required_if:role,spesialis'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan akun lain.',
            'role.required' => 'Pilih peran staff.',
            'role.in' => 'Peran staff harus perawat, dokter umum, atau dokter spesialis.',
            'spesialisasi.required_if' => 'Spesialisasi wajib dipilih untuk dokter spesialis.',
            'spesialisasi.in' => 'Spesialisasi tidak valid.',
            'password.required' => 'Password wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak sama.',
            'password.min' => 'Password minimal 8 karakter.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $validated['password'],
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        Dokter::pastikanUntuk($user, $validated['spesialisasi'] ?? null);

        AuditLog::catat(
            $request->user(),
            'membuat',
            'pengguna',
            (string) $user->id,
            "Membuat akun {$user->name} sebagai {$this->roleLabel($user->role)}.",
        );

        return to_route('admin.pengguna')
            ->with('success', "Akun {$user->name} berhasil dibuat sebagai {$this->roleLabel($user->role)}.");
    }

    /**
     * Ubah peran pengguna.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            abort(403, 'Anda tidak dapat mengubah peran akun sendiri.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(array_keys(self::ROLE_LABELS))],
        ], [
            'role.required' => 'Pilih peran pengguna.',
            'role.in' => 'Peran pengguna tidak valid.',
        ]);

        $user->update(['role' => $validated['role']]);

        $dokter = Dokter::pastikanUntuk($user);

        AuditLog::catat(
            $request->user(),
            'mengubah',
            'pengguna',
            (string) $user->id,
            "Mengubah peran {$user->name} menjadi {$this->roleLabel($user->role)}.",
        );

        $pesan = "Peran {$user->name} diubah menjadi {$this->roleLabel($user->role)}.";

        if ($dokter !== null && $user->role === 'spesialis' && blank($dokter->spesialisasi)) {
            $pesan .= ' Lengkapi spesialisasi dokter di menu Data dokter.';
        }

        return back()->with('success', $pesan);
    }

    /**
     * Hapus akun pengguna yang terdaftar.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            abort(403, 'Anda tidak dapat menghapus akun sendiri.');
        }

        $nama = $user->name;
        $peran = $this->roleLabel($user->role);

        AuditLog::catat(
            $request->user(),
            'menghapus',
            'pengguna',
            (string) $user->id,
            "Menghapus akun {$nama} ({$peran}).",
        );

        $user->delete();

        return to_route('admin.pengguna')
            ->with('success', "Akun {$nama} berhasil dihapus.");
    }

    private function roleLabel(string $role): string
    {
        return self::ROLE_LABELS[$role] ?? $role;
    }
}
