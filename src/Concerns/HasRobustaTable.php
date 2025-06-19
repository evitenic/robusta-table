<?php

namespace Evitenic\RobustaTable\Concerns;

use Evitenic\RobustaTable\Tables\RobustaTable;
use Filament\Support\Facades\FilamentView;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;
use Illuminate\Contracts\View\View;

trait HasRobustaTable
{
    use HasFavoritesBar;
    use HasReorderColumns;

    protected function makeBaseTable(): Table
    {
        return RobustaTable::make($this);
    }

    public function bootHasRobustaTable()
    {
        //
    }

    public function bootedHasRobustaTable()
    {
        $position = config('robusta-table.position_manage_columns');
        $this->registerLayoutViewToogleActionHook($position);
    }

    public function mountHasRobustaTable()
    {

        //

    }

    public function updatingHasRobustaTable($name, $value)
    {

        //

    }

    public function updatedHasRobustaTable($name, $value)
    {

        //

    }

    public function hydrateHasRobustaTable()
    {

        //

    }

    public function dehydrateHasRobustaTable()
    {

        //

    }

    public function renderingHasRobustaTable()
    {

        //

    }

    public function renderedHasRobustaTable($view)
    {
        // dd($view);
    }

    protected function registerLayoutViewToogleActionHook(string $filamentHook)
    {

        $action = Action::make('toggleColumns')
            ->label('Test')
            ->iconButton()
            ->icon('heroicon-m-view-columns')
            ->color('gray')
            ->livewireClickHandlerEnabled(false)
            ->table($this->getTable());
        FilamentView::registerRenderHook(
            $filamentHook,
            fn (): View => view('robusta-table::robusta-column.dropdown', [
                'triggerAction' => $action,
                'columns' => $this->getTable()->getColumns(),
            ]),
            scopes: static::class,
        );
    }
}
