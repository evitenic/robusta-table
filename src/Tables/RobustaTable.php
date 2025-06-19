<?php

namespace Evitenic\RobustaTable\Tables;

use Filament\Tables\Table;

class RobustaTable extends Table
{
    /**
     * off
     */
    public function hasToggleableColumns(): bool
    {
        return false;
    }
}
