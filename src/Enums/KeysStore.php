<?php

namespace Evitenic\RobustaTable\Enums;


enum KeysStore: string
{
    case Session = 'session';
    case Database = 'database';

    case ToggleColumns = 'toggled_columns';
    case OrderedColumns = 'ordered_columns';
}
