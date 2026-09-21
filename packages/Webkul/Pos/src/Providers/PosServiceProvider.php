<?php

namespace Webkul\Pos\Providers;

use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Webkul\GraphQLAPI\Listeners\SetCacheQuery as BaseSetCacheQuery;
use Webkul\Pos\Console\Commands\Install;
use Webkul\Pos\Helpers\ConfigurableOption;
use Webkul\Pos\Http\Middleware\Pos;
use Webkul\Pos\Http\Middleware\ValidateAgentOutlet;
use Webkul\Pos\Listeners\SetCacheQuery;
use Webkul\Product\Helpers\ConfigurableOption as BaseConfigurableOption;

class PosServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot(Router $router)
    {
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');

        Route::middleware('web')->group(__DIR__.'/../Routes/web.php');

        $this->loadTranslationsFrom(__DIR__.'/../Resources/lang', 'pos');

        $this->loadViewsFrom(__DIR__.'/../Resources/views', 'pos');

        $router->aliasMiddleware('pos', Pos::class);

        $this->app->booted(function () {
            $route = app('router')->getRoutes()->getByName('graphql');
            if ($route) {
                $route->middleware(ValidateAgentOutlet::class);
            }
        });

        $this->app->bind(BaseSetCacheQuery::class, SetCacheQuery::class);

        $this->app->bind(BaseConfigurableOption::class, ConfigurableOption::class);

        $this->publishAssets();

        if (core()->getConfigData('pos.settings.general.status')) {
            $this->mergeConfigFrom(
                dirname(__DIR__).'/Config/admin-menu.php', 'menu.admin'
            );
        }
    }

    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->register(EventServiceProvider::class);

        $this->app->register(ModuleServiceProvider::class);

        $this->registerCommands();

        $this->registerConfig();
    }

    /**
     * Register the console commands of this package
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                Install::class,
            ]);
        }
    }

    /**
     * Register package config.
     *
     * @return void
     */
    protected function registerConfig()
    {
        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/system.php', 'core'
        );

        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/acl.php', 'acl'
        );

        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/payment-methods.php', 'payment_methods'
        );

        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/auth/guards.php',
            'auth.guards'
        );

        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/auth/providers.php',
            'auth.providers'
        );

        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/auth/passwords.php',
            'auth.passwords'
        );

        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/bagisto-vite.php',
            'bagisto-vite.viters'
        );
    }

    /**
     * Publish the assets.
     *
     * @return void
     */
    protected function publishAssets()
    {
        $this->publishes([
            __DIR__.'/../../publishable/storage' => storage_path('app/public'),
        ]);

        $this->publishes([
            __DIR__.'/../../publishable' => public_path('themes/pos'),
        ], 'public');

        $this->publishes([
            __DIR__.'/../../publishable/flatpickr' => public_path('flatpickr'),
        ], 'public');

        $this->publishes([
            __DIR__.'/../schema.graphql' => base_path('vendor/bagisto/graphql-api/src/graphql/schema.graphql'),
        ]);

        $this->publishes([
            __DIR__.'/../Resources/views/admin/components/datagrid/toolbar/mass-action.blade.php' => resource_path('views/vendor/admin/components/datagrid/toolbar/mass-action.blade.php'),
        ]);
    }
}
