/**
 * Simple structured logger utility for the extension.
 * Provides leveled logging and can be toggled via localStorage flag.
 *
 * Usage: logger.debug('msg', { extra: 'data' })
 */
(function () {
  const NS = '[SNJRTE]';
  const LEVELS = ['debug', 'info', 'warn', 'error'];

  /**
   * @typedef {('debug'|'info'|'warn'|'error')} LogLevel
   */

  /**
   * @param {LogLevel} level
   * @returns {boolean}
   */
  const shouldLog = (level) => {
    try {
      const stored = localStorage.getItem('snjrte:logLevel') || 'info';
      const idx = LEVELS.indexOf(level);
      const minIdx = LEVELS.indexOf(stored);
      return idx >= 0 && minIdx >= 0 && idx >= minIdx;
    } catch {
      return level !== 'debug';
    }
  };

  /**
   * @param {LogLevel} level
   * @param {any[]} args
   */
  const log = (level, ...args) => {
    if (!shouldLog(level)) return;
    const prefix = `${NS}[${level.toUpperCase()}]`;
    // eslint-disable-next-line no-console
    (console[level] || console.log).call(console, prefix, ...args);
  };

  window.snjrteLogger = {
    debug: (...a) => log('debug', ...a),
    info: (...a) => log('info', ...a),
    warn: (...a) => log('warn', ...a),
    error: (...a) => log('error', ...a),
  };
})();
