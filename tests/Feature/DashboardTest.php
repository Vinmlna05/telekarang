<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated admin users are redirected to the admin beranda', function () {
    $this->actingAs($user = User::factory()->create(['role' => 'admin']));

    $this->get('/dashboard')->assertRedirect(route('admin.beranda', absolute: false));
});
