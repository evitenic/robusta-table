<?php

namespace Evitenic\RobustaTable\Concerns;

use Filament\Actions\Action;
use Throwable;
use Livewire\Livewire\Component;
use Evitenic\RobustaTable\Contracts\Store;
use Evitenic\RobustaTable\Enums\KeysStore;
use Evitenic\RobustaTable\Store\RobustaTableStore;
use Evitenic\RobustaTable\Tables\RobustaTable;
use Filament\Support\Facades\FilamentView;
use Filament\Tables\Table;
use Illuminate\Contracts\View\View;
use Livewire\Livewire;

trait HasRobustaTable
{
    public array $orderedColumns = [];

    public array $tmpToggledColumns = [];

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

        $this->getTable()->applyColumnExtraAttributes();

        $this->registerLayoutViewToogleActionHook(config('robusta-table.position_manage_columns'));

        if (! empty($this->orderedColumns)) {
            $this->getTable()->columns($this->getOrderedColumns($this->orderedColumns));
        }
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
        $componentClass = static::class;

        $action = Action::make('toggleColumns')
            ->label(__('robusta-table::robusta-table.manage_columns'))
            ->iconButton()
            ->icon(config('robusta-table.icons.manage-column'))
            ->color('gray')
            ->livewireClickHandlerEnabled(false);

        FilamentView::registerRenderHook(
            $filamentHook,
            function () use ($action, $componentClass): ?View {

                /**
                 * @var Component $currentComponent Current Livewire page component instance.
                 */
                $currentComponent = Livewire::current();

                // Check if component exists and is the right type
                if (! $currentComponent || ! $currentComponent instanceof $componentClass) {
                    return null;
                }

                // Additional check for the trait
                if (! in_array(HasRobustaTable::class, class_uses_recursive($currentComponent))) {
                    return null;
                }

                try {
                    $tableAction = clone $action;
                    $tableAction->table($currentComponent->getTable());

                    return view('robusta-table::robusta-column.dropdown', [
                        'triggerAction' => $tableAction,
                        'columns' => $currentComponent->getTable()->getColumns(),
                        'excludedReorderableColumns' => $currentComponent->getTable()->getExcludedReorderableColumns(),
                    ]);
                } catch (Throwable $e) {
                    return null;
                }
            }
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
            ->mapWithKeys(function ($name) use ($allColumns) {
                if (! isset($allColumns[$name])) {
                    return [];
                }

                return [$name => $allColumns[$name]];
            })
            ->all();
    }

    public function toggleColumnVisibility(string $columnName): void
    {
        data_set($this->getTable()->getLivewire()->toggledTableColumns, $columnName, $this->isTableColumnToggledHidden($columnName));
        $this->tmpToggledColumns = $this->getTable()->getLivewire()->toggledTableColumns;
        $this->storeToggleColumnState();
    }

    public function getToggleColumnState(string $columnName): bool
    {
        return ! $this->isTableColumnToggledHidden($columnName);
    }

    public function storeToggleColumnState(): void
    {
        if ($this->getTable()->isPersistingToggledColumns()) {
            $store = RobustaTableStore::getInstance()->db();
            $store->set(
                $this->toggleColumnKeyStore(),
                $this->getTable()->getLivewire()->toggledTableColumns
            );
        }
    }

    public function storeOrderedColumnsState(): void
    {
        if ($this->getTable()->isPersistingReorderedColumns()) {
            $store = RobustaTableStore::getInstance()->db();
            $key = KeysStore::OrderedColumns->value.'_';
            $store->set(
                $this->orderColumnKeyStore(),
                $this->orderedColumns
            );
        }
    }

    public function initSessionToggledColumns(Store $store): void
    {
        if ($this->getTable()->isPersistingToggledColumns()) {
            $toggledColumns = $store->get($this->toggleColumnKeyStore(), []);
            $this->getTable()->getLivewire()->toggledTableColumns = $toggledColumns;
        } else {
            if (empty($this->tmpToggledColumns)) {
                $store->forget($this->toggleColumnKeyStore());
                $this->getTable()->getLivewire()->toggledTableColumns = $this->getDefaultTableColumnToggleState();
            }
        }
    }

    public function initSessionOrderedColumns(Store $store): void
    {
        $allColumns = array_keys($this->getTable()->getColumns());

        if ($this->getTable()->isPersistingToggledColumns()) {
            $orderedColumns = $store->get($this->orderColumnKeyStore(), []);

            // Jika belum pernah disimpan, langsung gunakan default
            if (empty($orderedColumns)) {
                $orderedColumns = $allColumns;
            }

            $newColumns = array_diff($allColumns, $orderedColumns);

            if (! empty($newColumns)) {
                foreach ($newColumns as $column) {
                    $indexInDefault = array_search($column, $allColumns);

                    // Sisipkan ke orderedColumns di posisi $indexInDefault
                    array_splice($orderedColumns, $indexInDefault, 0, $column);
                }

                // Simpan kembali hasil baru
                $store->set($this->orderColumnKeyStore(), $orderedColumns);
            }

            $this->orderedColumns = $orderedColumns;
        } else {
            if (empty($this->orderedColumns)) {
                $store->forget($this->orderColumnKeyStore());
                $this->orderedColumns = $allColumns;
            }
        }
    }

    protected function toggleColumnKeyStore(): string
    {
        $key = KeysStore::ToggleColumns->value.'_'.$this->getName();

        return $key;
    }

    protected function orderColumnKeyStore(): string
    {
        $key = KeysStore::OrderedColumns->value.'_'.$this->getName();

        return $key;
    }

    /**
     * Resized Columns
     */
    public function getResizeableColumnsConfig(): array
    {
        return $this->getTable()->getResizeableColumnsConfig();
    }
}
