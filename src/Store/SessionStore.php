<?php

namespace Evitenic\RobustaTable\Store;

use Evitenic\RobustaTable\Contracts\Store;
use Illuminate\Support\Facades\Session;
use RuntimeException;

class SessionStore implements Store
{
    public function get(string $key, mixed $default = null): mixed
    {
        return Session::get($this->generateKey($key), $default);
    }

    public function set(string $key, mixed $value): void
    {
        Session::put($this->generateKey($key), $value);
    }

    public function has(string $key): bool
    {
        return Session::exists($this->generateKey($key));
    }

    public function forget(string $key): void
    {
        Session::forget($this->generateKey($key));
    }

    public function flush(): void
    {
        $prefix = config('robusta-table.prefix_store', 'robusta_table');
        $keys = array_keys(Session::all());

        foreach ($keys as $key) {
            if (str_starts_with($key, $prefix.'_')) {
                Session::forget($key);
            }
        }
    }

    public function all(): array
    {
        $prefix = config('robusta-table.prefix_store', 'robusta_table');
        $all = [];

        foreach (Session::all() as $key => $value) {
            if (str_starts_with($key, $prefix.'_')) {
                $all[str_replace($prefix.'_', '', $key)] = $value;
            }
        }

        return $all;
    }

    public function make(): static
    {
        return app(static::class);
    }

    protected function generateKey(string $key): string
    {
        $prefix = config('robusta-table.prefix_store', 'robusta_table');

        if (!is_string($prefix)) {
            throw new RuntimeException(
                'Configuration robusta-table.prefix_store must be a string'
            );
        }

        return "{$prefix}_{$key}";
    }
}
