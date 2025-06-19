<?php

namespace Evitenic\RobustaTable\Contracts;

interface Store
{
    public function get(string $key, mixed $default = null): mixed;

    public function set(string $key, mixed $value): void;

    public function has(string $key): bool;

    public function forget(string $key): void;

    public function flush(): void;

    public function all(): array;

    public function make(): static;
}
