<?php

namespace Webkul\Pos\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        $eventTemplates = [
            [
                'event'    => 'bagisto.admin.layout.head.before',
                'template' => 'pos::admin.layouts.style',
            ], [
                'event'    => 'bagisto.admin.sales.order.right_component.before',
                'template' => 'pos::admin.sales.order.view',
            ],
        ];

        foreach ($eventTemplates as $eventTemplate) {
            Event::listen(current($eventTemplate), fn ($e) => $e->addTemplate(end($eventTemplate)));
        }
    }
}
