@props(['columns', 'maxHeight' => null, 'triggerAction', 'width' => 'xs'])
@php
    $canReorderColumns = $this->getTable()->isReorderableColumns();
@endphp
<x-filament::dropdown :max-height="$maxHeight" placement="bottom-end" shift :width="$width"
    wire:key="{{ $this->getId() }}.robusta-manage-column" {{ $attributes->class(['fi-ta-col-toggle']) }}>
    <x-slot name="trigger">
        {{ $triggerAction }}
    </x-slot>

    <div x-data="{ isLoading: false }" class="p-6">
        <h4 class="text-base font-semibold leading-6 text-gray-950 dark:text-white">
            {{ __('robusta-table::robusta-table.columns') }}
        </h4>
        <div x-robusta-sortable="isLoading"
            x-on:sorted="
                isLoading = true;
                $wire.call('updateColumnOrder', $event.detail).finally(() => isLoading = false)
            "
            class="grid gap-y-4 mt-4">
            @foreach ($columns as $key => $column)
                @php
                    $isColumnVisible = $this->getToggleColumnState($column->getName());
                @endphp
                <div x-sortable-item="{{ $column->getName() }}"
                    :class="['flex gap-x-3 items-center', isLoading ? 'opacity-50' : '']"
                    wire:key="{{ $column->getName() }}">
                    @if ($column->isToggleable())
                        <x-filament::icon-button x-bind:disabled="isLoading" color="primary"
                            icon="{{ $isColumnVisible ? config('robusta-table.icons.column-visible') : config('robusta-table.icons.column-hidden') }}"
                            wire:click="toggleColumnVisibility('{{ $column->getName() }}')" />
                    @else
                        <div class="h-5 w-5"></div>
                    @endif

                    <span
                        class="text-sm font-medium leading-6 text-gray-950 dark:text-white flex-1">{{ $column->getLabel() }}</span>
                    <x-filament::icon
                        class="h-5 w-5 text-primary-600 dark:text-primary-500 robusta-sortable-handle cursor-move"
                        icon="{{ config('robusta-table.icons.order-column') }}" />
                </div>
            @endforeach
        </div>
    </div>

</x-filament::dropdown>
