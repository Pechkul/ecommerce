<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MysqlBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup-rotate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup MySQL database and keep only last 3 backups';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $backupDir = base_path();

        $date = now()->format('Ymd');
        $fileName = "{$backupDir}/backup_{$date}.sql";

        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host', '127.0.0.1');
        $dbName = config('database.connections.mysql.database');

        $configContent = "[client]\nuser=\"{$dbUser}\"\npassword=\"{$dbPass}\"\nhost=\"{$dbHost}\"\n";
        $configFile = storage_path('app/temp_my.cnf');
        File::put($configFile, $configContent);

        $backupCommand = sprintf(
            'mysqldump --defaults-extra-file=%s --no-tablespaces %s > %s 2>&1',
            escapeshellarg($configFile),
            escapeshellarg($dbName),
            escapeshellarg($fileName)
        );

        exec($backupCommand, $output, $returnVar);

        File::delete($configFile);

        if ($returnVar !== 0) {
            $this->error("Backup failed:");
            $this->line(implode("\n", $output));
            return;
        }

        $deleteDate = now()->subDays(3)->format('Ymd');
        $fileToDelete = "{$backupDir}/backup_{$deleteDate}.sql";

        File::delete($fileToDelete);

        $this->info("Backup file created: backup_{$date}.sql");
    }
}
