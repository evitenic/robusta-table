<?php

namespace Evitenic\RobustaTable\Concerns\Table;

trait HasColumnManager
{
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
}
