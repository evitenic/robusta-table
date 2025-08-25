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
                x-load
                x-load-src="{{ \Filament\Support\Facades\FilamentAsset::getAlpineComponentSrc('robusta-table-column-manager', 'evitenic/robusta-table') }}"
                x-data="robustaTableColumnManager({
                    columns: $wire.entangle('tableColumns'),
                    isLive: {{ $columnManagerApplyAction->isVisible() ? 'false' : 'true' }}
                })"
                :class="['fi-ta-col-manager-ctn', isLoading ? 'opacity-50' : '']"
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
                                                x-bind:disabled="isLoading"
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
                                                    {{ \Filament\Support\generate_icon_html(config('robusta-table.icons.column-visible')) }}
                                                </span>

                                                <span x-show="!(getColumn(column.name, null) || {}).isToggled" class="fi-icon-btn-icon">
                                                    {{ \Filament\Support\generate_icon_html(config('robusta-table.icons.column-hidden')) }}
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
                                            x-bind:disabled="isLoading"
                                            class="fi-ta-col-manager-reorder-handle fi-icon-btn"
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
    </x-filament::dropdown>
@endif
