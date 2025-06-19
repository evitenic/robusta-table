@props([
    'columns',
    'maxHeight' => null,
    'triggerAction',
    'width' => 'xs',
])

<x-filament::dropdown
    :max-height="$maxHeight"
    placement="bottom-end"
    shift
    :width="$width"
    wire:key="{{ $this->getId() }}.robusta-manage-column"
    {{ $attributes->class(['fi-ta-col-toggle']) }}
>
    <x-slot name="trigger">
        {{ $triggerAction }}
    </x-slot>

    <div class="grid gap-y-4 p-6">
        <h4
            class="text-base font-semibold leading-6 text-gray-950 dark:text-white"
        >
            {{ __('robusta-table::robusta-table.columns') }}
        </h4>

        @foreach ($columns as $column)
            <div class="flex gap-1 items-center">
                <x-filament::icon-button icon="{{config('robusta-table.icons.column-visible')}}" />
                {{ $column->getLabel() }}
            </div>
        @endforeach
    </div>
</x-filament::dropdown>
