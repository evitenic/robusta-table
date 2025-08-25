<?php

namespace Evitenic\RobustaTable;

use Evitenic\RobustaTable\Commands\RobustaTableCommand;
use Evitenic\RobustaTable\Testing\TestsRobustaTable;
use Filament\Support\Assets\AlpineComponent;
use Filament\Support\Assets\Asset;
use Filament\Support\Assets\Css;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Filament\Support\Facades\FilamentIcon;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Blade;
use Livewire\Features\SupportTesting\Testable;
use Spatie\LaravelPackageTools\Commands\InstallCommand;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class RobustaTableServiceProvider extends PackageServiceProvider
{
    public static string $name = 'robusta-table';

    public static string $viewNamespace = 'robusta-table';

    public function configurePackage(Package $package): void
    {
        /*
         * This class is a Package Service Provider
         *
         * More info: https://github.com/spatie/laravel-package-tools
         */
        $package->name(static::$name)
            ->hasViews(static::$name)
            ->hasCommands($this->getCommands())
            ->hasInstallCommand(function (InstallCommand $command) {
                $command
                    ->publishConfigFile()
                    ->publishMigrations()
                    ->askToRunMigrations()
                    ->askToStarRepoOnGitHub('evitenic/robusta-table');
            });

        $configFileName = $package->shortName();

        if (file_exists($package->basePath("/../config/{$configFileName}.php"))) {
            $package->hasConfigFile();
        }

        if (file_exists($package->basePath('/../database/migrations'))) {
            $package->hasMigrations($this->getMigrations());
        }

        if (file_exists($package->basePath('/../resources/lang'))) {
            $package->hasTranslations();
        }

        if (file_exists($package->basePath('/../resources/views'))) {
            $package->hasViews(static::$viewNamespace);
        }
    }

    public function packageRegistered(): void {}

    public function packageBooted(): void
    {
        // Asset Registration
        FilamentAsset::register(
            $this->getAssets(),
            $this->getAssetPackageName()
        );

        FilamentAsset::registerScriptData(
            $this->getScriptData(),
            $this->getAssetPackageName()
        );

        // Icon Registration
        FilamentIcon::register($this->getIcons());

        // Component Registration
        $this->registerComponents();

        // Handle Stubs
        if (app()->runningInConsole()) {
            foreach (app(Filesystem::class)->files(__DIR__.'/../stubs/') as $file) {
                $this->publishes([
                    $file->getRealPath() => base_path("stubs/robusta-table/{$file->getFilename()}"),
                ], 'robusta-table-stubs');
            }
        }

        // Testing
        Testable::mixin(new TestsRobustaTable);
    }

    protected function getAssetPackageName(): ?string
    {
        return 'evitenic/robusta-table';
    }

    /**
     * @return array<Asset>
     */
    protected function getAssets(): array
    {
        return [
            AlpineComponent::make('robusta-table', __DIR__.'/../resources/dist/robusta-table.js'),
            AlpineComponent::make('robusta-table-column-manager', __DIR__.'/../resources/dist/robusta-table-column-manager.js'),
            Css::make('robusta-table-styles', __DIR__.'/../resources/dist/robusta-table.css')->loadedOnRequest(),
            // Js::make('robusta-table-scripts', __DIR__ . '/../resources/dist/robusta-table.js'),
        ];
    }

    /**
     * @return array<class-string>
     */
    protected function getCommands(): array
    {
        return [
            RobustaTableCommand::class,
        ];
    }

    /**
     * @return array<string>
     */
    protected function getIcons(): array
    {
        return [];
    }

    /**
     * @return array<string>
     */
    protected function getRoutes(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    protected function getScriptData(): array
    {
        return [];
    }

    /**
     * @return array<string>
     */
    protected function getMigrations(): array
    {
        return [
            'create_robusta-table_table',
        ];
    }

    protected function registerComponents(): void
    {
        // Register Blade components
        Blade::component('robusta-table::wrapper', 'robusta-table.wrapper');
    }
}
