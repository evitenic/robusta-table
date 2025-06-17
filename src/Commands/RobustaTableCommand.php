<?php

namespace Evitenic\RobustaTable\Commands;

use Illuminate\Console\Command;

class RobustaTableCommand extends Command
{
    public $signature = 'robusta-table';

    public $description = 'My command';

    public function handle(): int
    {
        $this->comment('All done');

        return self::SUCCESS;
    }
}
