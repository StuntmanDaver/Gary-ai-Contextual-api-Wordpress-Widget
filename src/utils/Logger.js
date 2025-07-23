/**
 * Logger Utility for Gary AI Chat Widget
 * 
 * Provides structured logging with different levels and optional
 * integration with WordPress debug logging.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class Logger {
    constructor(context = 'GaryAI', options = {}) {
        this.context = context;
        this.level = options.level || this.getLogLevel();
        this.enableConsole = options.enableConsole !== false;
        this.enableStorage = options.enableStorage || false;
        this.maxStorageEntries = options.maxStorageEntries || 100;
        
        // Log levels (higher number = more verbose)
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        // Initialize storage if enabled
        if (this.enableStorage) {
            this.initializeStorage();
        }
    }

    /**
     * Get log level from environment or WordPress debug settings
     */
    getLogLevel() {
        // Check WordPress debug constants
        if (typeof window !== 'undefined' && window.garyAI?.debug) {
            return 'DEBUG';
        }
        
        // Check development environment
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
            return 'DEBUG';
        }
        
        return 'INFO';
    }

    /**
     * Initialize local storage for log persistence
     */
    initializeStorage() {
        try {
            if (!localStorage.getItem('gary-ai-logs')) {
                localStorage.setItem('gary-ai-logs', JSON.stringify([]));
            }
        } catch (error) {
            this.enableStorage = false;
            console.warn('Gary AI: Failed to initialize log storage');
        }
    }

    /**
     * Check if message should be logged at current level
     */
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    /**
     * Format log message with timestamp and context
     */
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${this.context}] [${level}]`;
        
        if (data) {
            return { prefix, message, data };
        }
        
        return { prefix, message };
    }

    /**
     * Store log entry in localStorage
     */
    storeLog(level, message, data = null) {
        if (!this.enableStorage) return;
        
        try {
            const logs = JSON.parse(localStorage.getItem('gary-ai-logs') || '[]');
            const entry = {
                timestamp: Date.now(),
                level,
                context: this.context,
                message,
                data
            };
            
            logs.push(entry);
            
            // Maintain max entries limit
            if (logs.length > this.maxStorageEntries) {
                logs.splice(0, logs.length - this.maxStorageEntries);
            }
            
            localStorage.setItem('gary-ai-logs', JSON.stringify(logs));
        } catch (error) {
            // Silently fail storage errors
        }
    }

    /**
     * Send log to WordPress backend (if configured)
     */
    async sendToWordPress(level, message, data = null) {
        // Only send ERROR and WARN levels to backend to avoid spam
        if (!['ERROR', 'WARN'].includes(level)) return;
        
        try {
            if (typeof window !== 'undefined' && window.garyAI?.logEndpoint) {
                await fetch(window.garyAI.logEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.garyAI.nonce || ''
                    },
                    body: JSON.stringify({
                        level: level.toLowerCase(),
                        message,
                        data,
                        context: this.context,
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    })
                });
            }
        } catch (error) {
            // Silently fail backend logging errors
        }
    }

    /**
     * Core logging method
     */
    log(level, message, data = null) {
        if (!this.shouldLog(level)) return;
        
        const formatted = this.formatMessage(level, message, data);
        
        // Console logging
        if (this.enableConsole) {
            const consoleMethod = this.getConsoleMethod(level);
            if (data) {
                consoleMethod(`${formatted.prefix} ${formatted.message}`, data);
            } else {
                consoleMethod(`${formatted.prefix} ${formatted.message}`);
            }
        }
        
        // Storage logging
        this.storeLog(level, message, data);
        
        // WordPress backend logging (async, non-blocking)
        this.sendToWordPress(level, message, data).catch(() => {
            // Silently handle errors
        });
    }

    /**
     * Get appropriate console method for log level
     */
    getConsoleMethod(level) {
        switch (level) {
            case 'ERROR':
                return console.error.bind(console);
            case 'WARN':
                return console.warn.bind(console);
            case 'DEBUG':
                return console.debug.bind(console);
            default:
                return console.log.bind(console);
        }
    }

    /**
     * Log error message
     */
    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    /**
     * Log info message
     */
    info(message, data = null) {
        this.log('INFO', message, data);
    }

    /**
     * Log debug message
     */
    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    /**
     * Log performance timing
     */
    time(label) {
        if (this.shouldLog('DEBUG')) {
            console.time(`${this.context}: ${label}`);
        }
    }

    /**
     * End performance timing
     */
    timeEnd(label) {
        if (this.shouldLog('DEBUG')) {
            console.timeEnd(`${this.context}: ${label}`);
        }
    }

    /**
     * Group related log messages
     */
    group(label) {
        if (this.shouldLog('DEBUG') && this.enableConsole) {
            console.group(`${this.context}: ${label}`);
        }
    }

    /**
     * End log group
     */
    groupEnd() {
        if (this.shouldLog('DEBUG') && this.enableConsole) {
            console.groupEnd();
        }
    }

    /**
     * Get stored logs
     */
    getLogs(level = null, limit = null) {
        if (!this.enableStorage) return [];
        
        try {
            let logs = JSON.parse(localStorage.getItem('gary-ai-logs') || '[]');
            
            // Filter by level if specified
            if (level) {
                logs = logs.filter(log => log.level === level);
            }
            
            // Limit results if specified
            if (limit) {
                logs = logs.slice(-limit);
            }
            
            return logs;
        } catch (error) {
            return [];
        }
    }

    /**
     * Clear stored logs
     */
    clearLogs() {
        if (this.enableStorage) {
            try {
                localStorage.setItem('gary-ai-logs', JSON.stringify([]));
                this.info('Logs cleared');
            } catch (error) {
                this.warn('Failed to clear logs');
            }
        }
    }

    /**
     * Export logs as text
     */
    exportLogs() {
        const logs = this.getLogs();
        const logText = logs.map(log => {
            const timestamp = new Date(log.timestamp).toISOString();
            const dataStr = log.data ? ` ${JSON.stringify(log.data)}` : '';
            return `[${timestamp}] [${log.context}] [${log.level}] ${log.message}${dataStr}`;
        }).join('\n');
        
        return logText;
    }

    /**
     * Set log level dynamically
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
            this.info(`Log level set to ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }

    /**
     * Create child logger with additional context
     */
    child(additionalContext) {
        return new Logger(`${this.context}:${additionalContext}`, {
            level: this.level,
            enableConsole: this.enableConsole,
            enableStorage: this.enableStorage,
            maxStorageEntries: this.maxStorageEntries
        });
    }
}
