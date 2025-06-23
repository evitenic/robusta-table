<?php

namespace Evitenic\RobustaTable\Concerns\Table;

use Closure;

trait HasReorderColumns
{
    protected bool|Closure $isReorderableColumns = false;

    protected bool|Closure $persistsReorderedColumns = false;

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
}
