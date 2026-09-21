<?php

use Illuminate\Support\Facades\Route;

/**
 * Shop Routes
 */
Route::group(['middleware' => ['shop', 'pos'], 'prefix' => 'pos'], function () {
    Route::view('{any?}', 'pos::shop.index')->where('any', '.*');
});
