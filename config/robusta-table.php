<?php

// config for Evitenic/RobustaTable

use Filament\Tables\View\TablesRenderHook;

return [
    'store_driver' => env('ROBUSTA_TABLE_STORE_DRIVER', 'session'),

    'prefix_store' => env('ROBUSTA_TABLE_PREFIX_STORE', 'robusta_table'),

    'icons' => [
        'manage-column' => 'heroicon-m-view-columns',
        'order-column' => 'heroicon-m-bars-2',
        'column-hidden' => 'heroicon-m-eye-slash',
        'column-visible' => 'heroicon-m-eye',
    ],

    'position_manage_columns' => TablesRenderHook::TOOLBAR_TOGGLE_COLUMN_TRIGGER_BEFORE,
];
