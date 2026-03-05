/**
 * Logger Utility
 * Provides structured logging for the realtime server
 */

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL || 'info';
    this.level = LOG_LEVEL_MAP[envLevel] || LogLevel.INFO;
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;
      
      if (meta) {
        console.log(logMessage, meta);
      } else {
        console.log(logMessage);
      }
    }
  }

  error(message: string, meta?: any) {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }
}

export const logger = new Logger();
