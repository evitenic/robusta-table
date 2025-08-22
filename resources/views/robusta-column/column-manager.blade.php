@props([
    'width' => 'xs',
    'excludedReorderableColumns',
    'columnManagerTriggerAction',
    'columnManagerApplyAction',
    'hasReorderableColumns',
    'hasToggleableColumns',
    'secondLevelHeadingTag',
    'reorderAnimationDuration',
    'hasColumnManagerDropdown' => false,
    'columnManagerMaxHeight' => null,
    'columnManagerWidth' => null,
    'columnManagerColumns' => null
])

@php
    use Filament\Support\Enums\GridDirection;
    use Illuminate\View\ComponentAttributeBag;
    use Filament\Support\View\Components\IconButtonComponent;
@endphp

@if($hasColumnManagerDropdown)
    <style>
        .fi-ta-col-manager-dropdown{
            display: none;
        }
    </style>

    <x-filament::dropdown
        :max-height="$columnManagerMaxHeight"
        placement="bottom-end"
        shift
        :width="$columnManagerWidth"
        wire:key="{{ $this->getId() }}.robusta-manage-column"
        class="fi-robusta-table-col-manager-dropdown"
    >
        <x-slot name="trigger">
            {{ $columnManagerTriggerAction }}
        </x-slot>

        <div class="p-6 fi-ta-col-manager">
            <div
                x-data="filamentTableColumnManager({
                    columns: $wire.entangle('tableColumns'),
                    isLive: {{ $columnManagerApplyAction->isVisible() ? 'false' : 'true' }}
                })"
                class="fi-ta-col-manager-ctn"
            >
                <div class="fi-ta-col-manager-header">
                    <{{ $secondLevelHeadingTag }} class="fi-ta-col-manager-heading">
                        {{ __('filament-tables::table.column_manager.heading') }}
                    </{{ $secondLevelHeadingTag }}>

                    <div>
                        <x-filament::link
                            :attributes="
                                \Filament\Support\prepare_inherited_attributes(
                                    new ComponentAttributeBag([
                                        'color' => 'danger',
                                        'tag' => 'button',
                                        'wire:click' => 'resetTableColumnManager',
                                        'wire:loading.remove.delay.'.config('filament.livewire_loading_delay', 'default') => '',
                                        'wire:target' => 'resetTableColumnManager'
                                    ])
                                )
                            "
                        >
                                {{ __('filament-tables::table.column_manager.actions.reset.label') }}
                        </x-filament::link>
                    </div>
                </div>

                <div
                    @if($hasReorderableColumns)
                        x-sortable
                        x-on:end.stop="reorderColumns($event.target.sortable.toArray())"
                        data-sortable-animation-duration="{{ $reorderAnimationDuration }}"
                    @endif
                    {{
                        (new ComponentAttributeBag)
                            ->grid($columnManagerColumns, GridDirection::Column)
                            ->class(['fi-ta-col-manager-items'])
                    }}
                >
                    <template
                        x-for="(column, index) in columns.filter((column) => !column.isHidden && (column.isToggleable && column.isReorderable))"
                        x-bind:key="(column.type == 'group' ? 'group::' : 'column::') + column.name + '_' + index"
                    >
                        <div
                            @if($hasReorderableColumns)
                                x-bind:x-sortable-item="column.type === 'group' ? 'group::' + column.name : 'column::' + column.name"
                            @endif
                        >
                            <template x-if="column.type !== 'group'">
                                <div class="fi-ta-col-manager-item">
                                    <label class="fi-ta-col-manager-label">
                                        @if($hasToggleableColumns)
                                            <button
                                                type="button"
                                                x-show="column.isToggleable"
                                                x-on:click.stop.prevent="toggleColumn(column.name)"
                                                {{
                                                    $attributes
                                                        ->class([
                                                            'fi-icon-btn',
                                                        ])
                                                        ->color(IconButtonComponent::class, 'primary')
                                                }}
                                            >
                                                <span x-show="(getColumn(column.name, null) || {}).isToggled" class="fi-icon-btn-icon">
                                                    {{ \Filament\Support\generate_icon_html(config('robusta-table.icons.column-hidden')) }}
                                                </span>

                                                <span x-show="!(getColumn(column.name, null) || {}).isToggled" class="fi-icon-btn-icon">
                                                    {{ \Filament\Support\generate_icon_html(config('robusta-table.icons.column-visible')) }}
                                                </span>
                                            </button>

                                            <div x-show="!column.isToggleable" class="h-5 w-5"></div>
                                        @endif

                                        <span x-text="column.label"></span>
                                    </label>

                                    @if($hasReorderableColumns)
                                        <button
                                            x-show="column.isReorderable"
                                            x-sortable-handle
                                            x-on:click.stop
                                            class="fi-ta-col-manager-reoder-handle fi-icon-btn"
                                            type="button"
                                        >
                                            {{ \Filament\Support\generate_icon_html(\Filament\Support\Icons\Heroicon::Bars2, alias: \Filament\Tables\View\TablesIconAlias::REORDER_HANDLE) }}
                                        </button>
                                    @endif
                                </div>
                            </template>
                        </div>
                    </template>
                </div>

                @if($columnManagerApplyAction->isVisible())
                    <div class="fi-ta-col-manager-apply-action-ctn">
                        {{ $columnManagerApplyAction }}
                    </div>
                @endif

            </div>
        </div>

        {{-- <div x-data="{ isLoading: false }" class="p-6">
            <h4 class="text-base font-semibold leading-6 text-gray-950 dark:text-white">
                {{ __('robusta-table::robusta-table.columns') }}
            </h4>
            <div x-robusta-sortable="{ isLoading: isLoading, data: @js($columnsKeys), fixed: @js($excludedReorderableColumnsKeys) }"
                x-on:sorted="
                    isLoading = true;
                    $wire.call('updateColumnOrder', $event.detail).finally(() => isLoading = false)
                "
                class="grid gap-y-4 mt-4 pt-4">
                @foreach ($reorderableColumns as $key => $column)
                    @php
                        $isColumnVisible = $this->getToggleColumnState($column->getName());
                        $isToggleable = $column->isToggleable();
                        $isNotSortable = in_array($column->getName(), $excludedReorderableColumnsKeys);
                        if ($column->isHidden()) {
                            continue;
                        }

                        if (!$isToggleable && $isNotSortable) {
                            continue;
                        }
                    @endphp

                    <div x-sortable-item="{{ $column->getName() }}"
                        :class="['flex gap-x-3 items-center', isLoading ? 'opacity-50' : '']"
                        wire:key="{{ $column->getName() }}">
                        @if ($isToggleable)
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
            @php
                $filteredExcludedReorderableColumns = array_filter(
                    $excludedReorderableColumns,
                    fn($column) => $column->isToggleable(),
                );
            @endphp
            @if (!empty($filteredExcludedReorderableColumns))
                <div class="grid gap-y-4 mt-4 border-t pt-4" style="border-style: dashed;">
                    @foreach ($filteredExcludedReorderableColumns as $key => $column)
                        @php
                            $isColumnVisible = $this->getToggleColumnState($column->getName());
                            if ($column->isHidden()) {
                                continue;
                            }
                        @endphp
                        <div x-sortable-item="{{ $column->getName() }}" :class="['flex gap-x-3 items-center']"
                            wire:key="{{ $column->getName() }}">
                            <x-filament::icon-button x-bind:disabled="isLoading" color="primary"
                                icon="{{ $isColumnVisible ? config('robusta-table.icons.column-visible') : config('robusta-table.icons.column-hidden') }}"
                                wire:click="toggleColumnVisibility('{{ $column->getName() }}')" />

                            <span
                                class="text-sm font-medium leading-6 text-gray-950 dark:text-white flex-1">{{ $column->getLabel() }}</span>
                        </div>
                    @endforeach
                </div>
            @endif
        </div> --}}
    </x-filament::dropdown>
@endif
