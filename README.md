# This is my package robusta-table

[![Latest Version on Packagist](https://img.shields.io/packagist/v/evitenic/robusta-table.svg?style=flat-square)](https://packagist.org/packages/evitenic/robusta-table)
[![GitHub Tests Action Status](https://img.shields.io/github/actions/workflow/status/evitenic/robusta-table/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/evitenic/robusta-table/actions?query=workflow%3Arun-tests+branch%3Amain)
[![GitHub Code Style Action Status](https://img.shields.io/github/actions/workflow/status/evitenic/robusta-table/fix-php-code-styling.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/evitenic/robusta-table/actions?query=workflow%3A"Fix+PHP+code+styling"+branch%3Amain)
[![Total Downloads](https://img.shields.io/packagist/dt/evitenic/robusta-table.svg?style=flat-square)](https://packagist.org/packages/evitenic/robusta-table)



This is where your description should go. Limit it to a paragraph or two. Consider adding a small example.

## Installation

You can install the package via composer:

```bash
composer require evitenic/robusta-table
```

You can publish and run the migrations with:

```bash
php artisan vendor:publish --tag="robusta-table-migrations"
php artisan migrate
```

You can publish the config file with:

```bash
php artisan vendor:publish --tag="robusta-table-config"
```

Optionally, you can publish the views using

```bash
php artisan vendor:publish --tag="robusta-table-views"
```

This is the contents of the published config file:

```php
return [
];
```

## Usage

```php
$robustaTable = new Evitenic\RobustaTable();
echo $robustaTable->echoPhrase('Hello, Evitenic!');
```

## Testing

```bash
composer test
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

- [evitenic](https://github.com/evitenic)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
