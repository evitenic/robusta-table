<?php

namespace Evitenic\RobustaTable\Concerns;

use Evitenic\RobustaTable\Contracts\Store;
use Evitenic\RobustaTable\Enums\KeysStore;
use Evitenic\RobustaTable\Store\RobustaTableStore;
use Evitenic\RobustaTable\Tables\RobustaTable;
use Filament\Support\Facades\FilamentView;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;
use Illuminate\Contracts\View\View;

trait HasRobustaTable
{
    public array $orderedColumns = [];

    protected function makeBaseTable(): Table
    {
        return RobustaTable::make($this);
    }

    public function bootHasRobustaTable() {}

    public function bootedHasRobustaTable()
    {
        $store = RobustaTableStore::getInstance()->db();
        $this->initSessionToggledColumns($store);
        $this->initSessionOrderedColumns($store);

        $this->registerLayoutViewToogleActionHook(config('robusta-table.position_manage_columns'));
        if (!empty($this->orderedColumns)) $this->getTable()->columns($this->getOrderedColumns($this->orderedColumns));
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
        //
    }

    protected function registerLayoutViewToogleActionHook(string $filamentHook)
    {

        $action = Action::make('toggleColumns')
            ->label('Test')
            ->iconButton()
            ->icon(config('robusta-table.icons.manage-column'))
            ->color('gray')
            ->livewireClickHandlerEnabled(false)
            ->table($this->getTable());

        FilamentView::registerRenderHook(
            $filamentHook,
            fn(): View => view('robusta-table::robusta-column.dropdown', [
                'triggerAction' => $action,
                'columns' => $this->getTable()->getColumns(),
            ]),
            scopes: static::class,
        );
    }

    public function getColumnToggleForm()
    {
        return $this->getTable()->getLivewire()->getTableColumnToggleForm();
    }

    public function updateColumnOrder(array $orderedColumns): void
    {
        $this->orderedColumns = $orderedColumns;
        $this->getTable()->columns($this->getOrderedColumns($orderedColumns));
        $this->storeOrderedColumnsState();
    }

    public function getOrderedColumns(array $orderedNames): array
    {
        $allColumns = $this->getTable()->getColumns();

        return collect($orderedNames)
            ->mapWithKeys(fn($name) => [$name => $allColumns[$name]])
            ->all();
    }

    public function toggleColumnVisibility(string $columnName): void
    {
        data_set($this->getTable()->getLivewire()->toggledTableColumns, $columnName, $this->isTableColumnToggledHidden($columnName));
        $this->storeToggleColumnState();
    }

    public function getToggleColumnState(string $columnName): bool
    {
        return !$this->isTableColumnToggledHidden($columnName);
    }

    public function storeToggleColumnState(): void
    {
        if ($this->getTable()->isPersistingToggledColumns()) {
            $store = RobustaTableStore::getInstance()->db();
            $store->set(
                KeysStore::ToggleColumns->value,
                $this->getTable()->getLivewire()->toggledTableColumns
            );
        }
    }

    public function storeOrderedColumnsState(): void
    {
        if ($this->getTable()->isPersistingReorderedColumns()) {
            $store = RobustaTableStore::getInstance()->db();
            $store->set(
                KeysStore::OrderedColumns->value,
                $this->orderedColumns
            );
        }
    }

    public function initSessionToggledColumns(Store $store): void
    {
        if ($this->getTable()->isPersistingToggledColumns()) {
            $toggledColumns = $store->get(KeysStore::ToggleColumns->value, []);
            $this->getTable()->getLivewire()->toggledTableColumns = $toggledColumns;
        } else {
            $store->forget(KeysStore::ToggleColumns->value);
            $this->getTable()->getLivewire()->toggledTableColumns = $this->getDefaultTableColumnToggleState();
        }
    }

    public function initSessionOrderedColumns(Store $store): void
    {
        if ($this->getTable()->isPersistingToggledColumns()) {
            $orderedColumns = $store->get(KeysStore::OrderedColumns->value, []);
            $this->orderedColumns = $orderedColumns;
        } else {
            $store->forget(KeysStore::OrderedColumns->value);
            $this->orderedColumns = array_keys($this->getTable()->getColumns());
        }
    }
}
