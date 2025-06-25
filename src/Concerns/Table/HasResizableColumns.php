<?php

namespace Evitenic\RobustaTable\Concerns\Table;

use Closure;
use Illuminate\Support\Str;

trait HasResizableColumns
{
    protected array | Closure $resizableColumnsConfig = [];


    protected array $columnWidths = [];

    public function resizableColumns(array|Closure $config = []): static
    {
        $this->resizableColumnsConfig = $config;

        return $this;
    }

    public function getResizableColumnsConfig(): array
    {
        $arrayMerge = array_merge($this->getDefaultResizableColumnsConfig(), $this->evaluate($this->resizableColumnsConfig));

        return $arrayMerge;
    }

    public function getTableKey(): string
    {
        return "rbs_table_{$this->getPluralModelLabel()}_resizable_columns";
    }

    public function getDefaultResizableColumnsConfig(): array
    {
        return [
            'enable' => true,
            'tableKey' => $this->getTableKey(),
            'minColumnWidth' => 100,
            'maxColumnWidth' => 1000,
        ];
    }

    public function applyColumnExtraAttributes()
    {
        $columns = $this->getColumns();

        foreach ($columns as $column) {
            $width = $this->columnWidths[$column->getName()]['width'] ?? null;
            $styles = $this->getColumnStyles($width);

            $columnName = $column->getName();

            $column->extraHeaderAttributes([
                'x-robusta-table-column' => $columnName,
                ...$styles['header']
            ])
                ->extraCellAttributes($styles['cell']);
        }
    }

    protected function getColumnStyles(?string $width): array
    {
        if (! $width) {
            return ['header' => [], 'cell' => []];
        }
        $getWidth = $this->getWidth($width);
        $style = "min-width: {$getWidth}; width: {$getWidth}; max-width: {$getWidth}";


        return [
            'header' => ['style' => $style],
            'cell' => ['style' => "{$style}; overflow: hidden"],
        ];
    }

    public function getWidth($width): ?string
    {
        if (is_int($width)) {
            $width = "{$width}px";
        }

        return $width;
    }
}
