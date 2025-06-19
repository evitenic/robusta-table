<?php

namespace Evitenic\RobustaTable\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \Evitenic\RobustaTable\RobustaTable
 */
class RobustaTable extends Facade
{
    protected static function getFacadeAccessor()
    {
        return RobustaTable::class;
    }
}
