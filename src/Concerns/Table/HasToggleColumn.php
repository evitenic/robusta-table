<?php

namespace Evitenic\RobustaTable\Concerns\Table;

use Closure;

trait HasToggleColumn
{
    protected bool|Closure $persistsToggledColumns = false;

    public function persistsToggledColumns(bool $persists = true): static
    {
        $this->persistsToggledColumns = $persists;

        return $this;
    }

    public function isPersistingToggledColumns(): bool
    {
        return $this->evaluate($this->persistsToggledColumns);
    }

    /**
     * disable default toggleable columns feature
     */
    public function hasToggleableColumns(): bool
    {
        return false;
    }
}
