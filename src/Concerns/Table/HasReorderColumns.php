<?php

namespace Evitenic\RobustaTable\Concerns\Table;

use Closure;

trait HasReorderColumns
{
    protected bool|Closure $isReorderableColumns = false;

    protected bool|Closure $persistsReorderedColumns = false;

    protected array|Closure $excludedReorderableColumns = [];

    public function reorderableColumns(bool|Closure $isReorderableColumns = true): static
    {
        $this->isReorderableColumns = $isReorderableColumns;

        return $this;
    }

    public function isReorderableColumns(): bool
    {
        return $this->evaluate($this->isReorderableColumns);
    }

    public function persistsReorderedColumns(bool $persists = true): static
    {
        $this->persistsReorderedColumns = $persists;

        return $this;
    }

    public function isPersistingReorderedColumns(): bool
    {
        return $this->evaluate($this->persistsReorderedColumns);
    }

    public function excludedReorderableColumns(array|Closure $excludedReorderableColumns = []): static
    {
        $this->excludedReorderableColumns = $excludedReorderableColumns;

        return $this;
    }

    public function getExcludedReorderableColumns(): array
    {
        return collect($this->evaluate($this->excludedReorderableColumns))
            ->mapWithKeys(fn ($column) => [$column => $this->getColumn($column)])
            ->all();
    }

    public function hasReorderableColumns(): bool
    {
        return false;
    }
}
