<?php

namespace Evitenic\RobustaTable\Tables;

use Evitenic\RobustaTable\Concerns\Table\HasColumnManager;
use Evitenic\RobustaTable\Concerns\Table\HasResizeableColumns;
use Filament\Tables\Table;

class RobustaTable extends Table
{
    use HasColumnManager;
    use HasResizeableColumns;
}
