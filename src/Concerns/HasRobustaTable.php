<?php

namespace Evitenic\RobustaTable\Concerns;

use Evitenic\RobustaTable\Contracts\Store;
use Evitenic\RobustaTable\Enums\KeysStore;
use Evitenic\RobustaTable\Store\RobustaTableStore;
use Evitenic\RobustaTable\Tables\Components\EmbeddedTable;
use Evitenic\RobustaTable\Tables\RobustaTable;
use Filament\Actions\Action;
use Filament\Schemas\Components\RenderHook;
use Filament\Schemas\Schema;
use Filament\Support\Facades\FilamentView;
use Filament\Tables\Columns\Column;
use Filament\Tables\Table;
use Filament\View\PanelsRenderHook;
use Illuminate\Contracts\View\View;
use Livewire\Livewire;
use Livewire\Livewire\Component;
use Throwable;

trait HasRobustaTable
{
    public const TABLE_COLUMN_MANAGER_COLUMN_TYPE = 'column';

    public array $orderedColumns = [];

    public array $tmpToggledColumns = [];

    protected function makeBaseTable(): Table
    {
        return RobustaTable::make($this);
    }

    public function bootHasRobustaTable() {}

    public function bootedHasRobustaTable()
    {
        // $store = RobustaTableStore::getInstance()->db();
        // $this->initSessionToggledColumns($store);
        // $this->initSessionOrderedColumns($store);

        $this->getTable()->applyColumnExtraAttributes();

        // $this->registerLayoutViewToogleActionHook(config('robusta-table.position_manage_columns'));

        // if (! empty($this->orderedColumns)) {
        //     $this->getTable()->columns($this->getOrderedColumns($this->orderedColumns));
        // }
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

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
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
            },
        );
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
    public function getColumnToggleForm()
    {
        return $this->getTable()->getLivewire()->getTableColumnToggleForm();
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
    public function updateColumnOrder(array $orderedColumns): void
    {
        $this->orderedColumns = $orderedColumns;
        $this->getTable()->columns($this->getOrderedColumns($orderedColumns));
        $this->storeOrderedColumnsState();
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
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

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
    public function toggleColumnVisibility(string $columnName): void
    {
        data_set($this->getTable()->getLivewire()->toggledTableColumns, $columnName, $this->isTableColumnToggledHidden($columnName));
        $this->tmpToggledColumns = $this->getTable()->getLivewire()->toggledTableColumns;
        $this->storeToggleColumnState();
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
    public function getToggleColumnState(string $columnName): bool
    {
        return ! $this->isTableColumnToggledHidden($columnName);
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
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

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
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

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
    public function initSessionToggledColumns(Store $store): void
    {
        if ($this->getTable()->isPersistingToggledColumns()) {
            $toggledColumns = $store->get($this->toggleColumnKeyStore(), []);
            $this->getTable()->getLivewire()->toggledTableColumns = $toggledColumns;
        } else {
            if (empty($this->tmpToggledColumns)) {
                $store->forget($this->toggleColumnKeyStore());
                $this->getTable()->getLivewire()->toggledTableColumns = $this->getDefaultTableColumnState();
                // dd($this->getTable()->getLivewire()->toggledTableColumns);
            }
        }
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
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

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
    protected function toggleColumnKeyStore(): string
    {
        $key = KeysStore::ToggleColumns->value.'_'.$this->getName();

        return $key;
    }

    /**
     * @deprecated since 2.x this method is deprecated and will be removed
     */
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

    protected function mapTableColumnToArray(Column $column): array
    {
        return [
            'type' => self::TABLE_COLUMN_MANAGER_COLUMN_TYPE,
            'name' => $column->getName(),
            'label' => (string) $column->getLabel(),
            'isHidden' => $column->isHidden(),
            'isToggled' => ! $column->isToggleable() || ! $column->isToggledHiddenByDefault(),
            'isToggleable' => $column->isToggleable(),
            'isToggledHiddenByDefault' => $column->isToggleable() ? $column->isToggledHiddenByDefault() : null,
            'isResized' => ! in_array($column, $this->getTable()->getExcludedResizeableColumns()),
        ];
    }

    public function content(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getTabsContentComponent(),
                RenderHook::make(PanelsRenderHook::RESOURCE_PAGES_LIST_RECORDS_TABLE_BEFORE),
                EmbeddedTable::make(),
                RenderHook::make(PanelsRenderHook::RESOURCE_PAGES_LIST_RECORDS_TABLE_AFTER),
            ]);
    }
}
