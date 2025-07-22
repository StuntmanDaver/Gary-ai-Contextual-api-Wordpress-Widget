<?php
namespace GaryAI;

/**
 * Simple PSR-4 autoloader for plugin classes.
 * This loader is only used if Composer's autoloader is unavailable.
 */
class Autoloader {
    /**
     * Base namespace prefix.
     */
    private const PREFIX = 'GaryAI\\';

    /**
     * Base directory for the namespace prefix.
     * @var string
     */
    private static string $baseDir;

    /**
     * Register the autoloader with SPL.
     */
    public static function register(): void {
        if ( isset( self::$baseDir ) ) {
            // Already registered.
            return;
        }
        self::$baseDir = dirname( __DIR__ ) . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR;
        spl_autoload_register( [ __CLASS__, 'autoload' ] );
    }

    /**
     * Autoload callback.
     *
     * @param string $class Fully-qualified class name.
     */
    private static function autoload( string $class ): void {
        // Ignore classes outside our namespace.
        if ( strncmp( self::PREFIX, $class, strlen( self::PREFIX ) ) !== 0 ) {
            return;
        }

        // Strip the prefix and convert namespace separators to directory separators.
        $relativeClass = substr( $class, strlen( self::PREFIX ) );
        $relativePath  = str_replace( '\\', DIRECTORY_SEPARATOR, $relativeClass ) . '.php';

        $file = self::$baseDir . $relativePath;

        if ( file_exists( $file ) ) {
            require_once $file;
        }
    }
}
