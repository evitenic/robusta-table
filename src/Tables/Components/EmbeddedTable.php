<?php

namespace Evitenic\RobustaTable\Tables\Components;

use Exception;
use Filament\Schemas\Components\EmbeddedTable as BaseComponent;
use Filament\Tables\Contracts\HasTable;
use Illuminate\Contracts\View\View;

class EmbeddedTable extends BaseComponent
{
    public function render(): View
    {
        $livewire = $this->getLivewire();

        if (! ($livewire instanceof HasTable)) {
            throw new Exception('The ['.$livewire::class.'] component must have a table defined.');
        }

        return view('robusta-table::components.embedded-table', [
            'table' => $livewire->getTable(),
        ]);
    }
}
