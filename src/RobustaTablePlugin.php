<?php

namespace Evitenic\RobustaTable;

use Filament\Contracts\Plugin;
use Filament\Panel;

class RobustaTablePlugin implements Plugin
{
    public function getId(): string
    {
        return 'robusta-table';
    }

    public function register(Panel $panel): void
    {
        //
    }

    public function boot(Panel $panel): void
    {
        //
    }

    public static function make(): static
    {
        return app(static::class);
    }

    public static function get(): static
    {
        /** @var static $plugin */
        $plugin = filament(app(static::class)->getId());

        return $plugin;
    }
}
