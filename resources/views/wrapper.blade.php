<div x-load
    x-load-src="{{ \Filament\Support\Facades\FilamentAsset::getAlpineComponentSrc('robusta-table', 'evitenic/robusta-table') }}"
    x-data="initRobustaTable({ resizedColumn: @js($this->getResizeableColumnsConfig()) })" @if ($this->getTable()->isLoaded()) x-init="registerPlugin()" @endif>
    {{ $slot }}
</div>
