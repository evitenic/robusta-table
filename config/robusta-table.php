<?php

// config for Evitenic/RobustaTable

use Filament\Tables\View\TablesRenderHook;

return [
    'icons' => [
        'manage-column' => 'heroicon-m-view-columns',
        'order-column' => 'heroicon-m-bars-2',
        'column-hidden' => 'heroicon-m-eye-slash',
        'column-visible' => 'heroicon-m-eye',
    ],

    'position_manage_columns' => TablesRenderHook::TOOLBAR_COLUMN_MANAGER_TRIGGER_AFTER,
];
