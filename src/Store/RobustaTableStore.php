<?php

namespace Evitenic\RobustaTable\Store;

use Evitenic\RobustaTable\Contracts\Store;

class RobustaTableStore
{
    protected static ?self $instance = null;

    protected Store $store;

    protected function __construct()
    {
        $configStore = config('robusta-table.store_driver');

        if (is_null($configStore)) {
            throw new \RuntimeException('Store configuration is not set.');
        }

        if ($configStore === 'session') {
            $this->store = new SessionStore;
        } elseif (class_exists($configStore)) {
            $this->store = app($configStore); // Bisa inject via container
        } else {
            throw new \RuntimeException("Store class {$configStore} does not exist.");
        }
    }

    public static function getInstance(): self
    {
        if (! static::$instance) {
            static::$instance = new static;
        }

        return static::$instance;
    }

    public function db(): Store
    {
        return $this->store;
    }
}
