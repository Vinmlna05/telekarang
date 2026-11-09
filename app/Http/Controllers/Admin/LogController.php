<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    /**
     * Log aktivitas seluruh pengguna.
     */
    public function __invoke(): Response
    {
        $log = AuditLog::query()
            ->with('user:id,name,role')
            ->orderByDesc('waktu')
            ->orderByDesc('id')
            ->get()
            ->map(fn (AuditLog $item) => [
                'id' => $item->id,
                'aktor' => $item->user?->name ?? 'Sistem',
                'peran' => $item->user?->role ?? 'sistem',
                'aksi' => $item->aksi,
                'entitas' => $item->entitas,
                'entitasId' => $item->entitas_id ?? '',
                'keterangan' => $item->keterangan ?? '',
                'waktu' => $item->waktu->toIso8601String(),
            ]);

        return Inertia::render('admin/log', [
            'log' => $log,
        ]);
    }
}
