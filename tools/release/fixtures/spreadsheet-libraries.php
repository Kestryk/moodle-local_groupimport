<?php
// Standalone third-party libraries only; never load Moodle config/bootstrap.
$libraryroot = $argv[1] ?? '';
if (!is_dir($libraryroot . '/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet')) {
    throw new RuntimeException('Pass the path of the Moodle lib directory (read-only libraries).');
}
spl_autoload_register(static function (string $class) use ($libraryroot): void {
    $map = [
        'PhpOffice\\PhpSpreadsheet\\' => '/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet/',
        'Composer\\Pcre\\' => '/composer/pcre/src/',
        'Psr\\SimpleCache\\' => '/psr/simple-cache/src/',
        'Psr\\Http\\Message\\' => '/psr/http-message/src/',
        'ZipStream\\' => '/zipstream/src/',
        'Matrix\\' => '/phpspreadsheet/markbaker/matrix/classes/src/',
        'Complex\\' => '/phpspreadsheet/markbaker/complex/classes/src/',
    ];
    foreach ($map as $prefix => $relative) {
        if (str_starts_with($class, $prefix)) {
            $file = $libraryroot . $relative . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (is_file($file)) { require $file;
            }
            return;
        }
    }
});
