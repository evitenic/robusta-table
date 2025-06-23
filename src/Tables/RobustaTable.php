<?php

namespace Evitenic\RobustaTable\Tables;

use Filament\Tables\Table;
use Evitenic\RobustaTable\Concerns\Table\HasReorderColumns;
use Evitenic\RobustaTable\Concerns\Table\HasToggleColumn;

class RobustaTable extends Table
{
    use HasReorderColumns, HasToggleColumn;
}
