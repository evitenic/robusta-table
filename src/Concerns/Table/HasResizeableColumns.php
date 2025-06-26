<?php

namespace Evitenic\RobustaTable\Concerns\Table;

use Closure;

trait HasResizeableColumns
{
    protected array | Closure $resizeableColumnsConfig = [];

    protected array | Closure $excludedResizeableColumns = [];

    protected array $columnWidths = [];

    public function resizeableColumns(array | Closure $config = []): static
    {
        $this->resizeableColumnsConfig = $config;

        return $this;
    }

    public function getResizeableColumnsConfig(): array
    {
        $arrayMerge = array_merge($this->getDefaultResizeableColumnsConfig(), $this->evaluate($this->resizeableColumnsConfig));

        return $arrayMerge;
    }

    public function getTableKey(): string
    {
        return "rbs_table_{$this->getPluralModelLabel()}_resizeable_columns";
    }

    public function getDefaultResizeableColumnsConfig(): array
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
            $excludedColumns = $this->getExcludedResizeableColumns();
            $width = $this->columnWidths[$column->getName()]['width'] ?? null;
            $styles = $this->getColumnStyles($width);

            $columnName = $column->getName();

            if (isset($excludedColumns[$column->getName()])) {
                $column->extraHeaderAttributes([
                    'x-robusta-table-exclude-column' => $columnName,
                ]);
            } else {
                $column->extraHeaderAttributes([
                    'x-robusta-table-column' => $columnName,
                    ...$styles['header'],
                ])
                    ->extraCellAttributes($styles['cell']);
            }
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

    public function excludedResizeableColumns(array | Closure $excludedColumns = []): static
    {
        $this->excludedResizeableColumns = $excludedColumns;

        return $this;
    }

    public function getExcludedResizeableColumns(): array
    {
        return collect($this->evaluate($this->excludedResizeableColumns))
            ->mapWithKeys(fn($column) => [$column => $this->getColumn($column)])
            ->all();
    }
}
