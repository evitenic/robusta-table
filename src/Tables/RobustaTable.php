<?php

namespace Evitenic\RobustaTable\Tables;

use Evitenic\RobustaTable\Concerns\Table\HasReorderColumns;
use Evitenic\RobustaTable\Concerns\Table\HasResizeableColumns;
use Evitenic\RobustaTable\Concerns\Table\HasToggleColumn;
use Filament\Tables\Table;

class RobustaTable extends Table
{
    use HasReorderColumns;
    use HasResizeableColumns;
    use HasToggleColumn;
}
