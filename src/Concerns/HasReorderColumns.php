<?php

namespace Evitenic\RobustaTable\Concerns;

trait HasReorderColumns
{
    public function canReorderColumns(): bool {
        return true;
    }
}
