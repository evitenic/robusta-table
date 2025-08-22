<?php

namespace Evitenic\RobustaTable\Concerns\Table;

use Filament\Actions\Action;

trait HasColumnManager
{
    protected Action $robustaTableColumnManagerTriggerAction;

    protected array $excludedReorderColumns = [];

    public function excludeReorderColumns(array $columns): static
    {
        $this->excludedReorderColumns = $columns;

        return $this;
    }

    public function getExcludedReorderColumns(): array
    {
        return $this->evaluate($this->excludedReorderColumns);
    }

    public function robustaTableColumnManagerTriggerAction(Action $action): static
    {
        $this->robustaTableColumnManagerTriggerAction = $action;

        return $this;
    }

    public function getRobustaTableColumnManagerTriggerAction(): Action
    {
        return $this->robustaTableColumnManagerTriggerAction ?? Action::make('toggleColumns')
            ->label(__('robusta-table::robusta-table.manage_columns'))
            ->iconButton()
            ->icon(config('robusta-table.icons.manage-column'))
            ->color('gray')
            ->livewireClickHandlerEnabled(false);
    }
}
