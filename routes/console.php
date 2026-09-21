<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Schedule::command('db:backup-rotate')->dailyAt('01:00');