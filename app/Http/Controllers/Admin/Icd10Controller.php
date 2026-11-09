<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Icd10;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class Icd10Controller extends Controller
{
    /**
     * Daftar kode diagnosis ICD-10.
     */
    public function index(): Response
    {
        $daftar = Icd10::query()
            ->orderBy('kode')
            ->get()
            ->map(fn (Icd10 $icd10) => [
                'kode' => $icd10->kode,
                'nama' => $icd10->nama_diagnosis,
                'pemakaian' => $icd10->pemakaian,
            ]);

        return Inertia::render('admin/icd10', [
            'daftar' => $daftar,
        ]);
    }

    /**
     * Tambahkan kode ICD-10 baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        Icd10::query()->create([
            'kode' => $validated['kode'],
            'nama_diagnosis' => $validated['nama'],
            'pemakaian' => 0,
        ]);

        AuditLog::catat(
            $request->user(),
            'membuat',
            'icd10',
            $validated['kode'],
            "Menambahkan kode ICD-10 {$validated['kode']} ({$validated['nama']}).",
        );

        return to_route('admin.icd10')
            ->with('success', "Kode {$validated['kode']} berhasil ditambahkan.");
    }

    /**
     * Perbarui kode ICD-10.
     */
    public function update(Request $request, Icd10 $icd10): RedirectResponse
    {
        $validated = $this->validated($request, $icd10);

        $icd10->update([
            'kode' => $validated['kode'],
            'nama_diagnosis' => $validated['nama'],
        ]);

        AuditLog::catat(
            $request->user(),
            'mengubah',
            'icd10',
            $validated['kode'],
            "Memperbarui kode ICD-10 {$validated['kode']} ({$validated['nama']}).",
        );

        return to_route('admin.icd10')
            ->with('success', "Kode {$validated['kode']} berhasil diperbarui.");
    }

    /**
     * Hapus kode ICD-10 yang belum pernah dipakai.
     */
    public function destroy(Icd10 $icd10): RedirectResponse
    {
        if ($icd10->pemakaian > 0) {
            return back()->with('error', "Kode {$icd10->kode} tidak dapat dihapus karena sudah dipakai pada hasil konsultasi.");
        }

        $kode = $icd10->kode;
        $nama = $icd10->nama_diagnosis;

        $icd10->delete();

        AuditLog::catat(
            request()->user(),
            'menghapus',
            'icd10',
            $kode,
            "Menghapus kode ICD-10 {$kode} ({$nama}).",
        );

        return back()->with('success', "Kode {$kode} berhasil dihapus.");
    }

    /**
     * Validasi kode ICD-10 dengan normalisasi huruf besar.
     *
     * @return array{kode: string, nama: string}
     */
    private function validated(Request $request, ?Icd10 $icd10 = null): array
    {
        $request->merge([
            'kode' => strtoupper(trim($request->string('kode')->toString())),
            'nama' => trim($request->string('nama')->toString()),
        ]);

        return $request->validate([
            'kode' => [
                'required',
                'string',
                'max:10',
                'regex:/^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/',
                Rule::unique('icd10', 'kode')->ignore($icd10?->kode, 'kode'),
            ],
            'nama' => ['required', 'string', 'min:3', 'max:255'],
        ], [
            'kode.required' => 'Kode ICD-10 wajib diisi.',
            'kode.regex' => 'Format kode tidak valid. Contoh: I10 atau J06.9.',
            'kode.unique' => 'Kode sudah ada di daftar.',
            'nama.required' => 'Nama diagnosis wajib diisi.',
            'nama.min' => 'Nama diagnosis minimal 3 karakter.',
        ]);
    }
}
