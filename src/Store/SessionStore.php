<?php

namespace Evitenic\RobustaTable\Store;

use Evitenic\RobustaTable\Contracts\Store;
use RuntimeException;

class SessionStore implements Store
{
    public function get(string $key, mixed $default = null): mixed
    {
        return session()->get($this->generateKey($key), $default);
    }

    public function set(string $key, mixed $value): void
    {
        session()->put($this->generateKey($key), $value);
    }

    public function has(string $key): bool
    {
        return session()->exists($this->generateKey($key));
    }

    public function forget(string $key): void
    {
        session()->forget($this->generateKey($key));
    }

    public function flush(): void
    {
        $prefix = config('robusta-table.prefix_store', 'robusta_table');
        $keys = array_keys(session()->all());

        foreach ($keys as $key) {
            if (str_starts_with($key, $prefix.'_')) {
                session()->forget($key);
            }
        }
    }

    public function all(): array
    {
        $prefix = config('robusta-table.prefix_store', 'robusta_table');
        $all = [];

        foreach (session()->all() as $key => $value) {
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

        if (! is_string($prefix)) {
            throw new RuntimeException(
                'Configuration robusta-table.prefix_store must be a string'
            );
        }

        return "{$prefix}_{$key}";
    }
}
