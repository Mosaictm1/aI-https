// ============================================
// Logger Configuration - Winston
// ============================================

import winston from 'winston';
import { env } from './env.js';

// ==================== Formats ====================

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
});

// ==================== Create Logger ====================

export const logger = winston.createLogger({
    level: env.isDevelopment ? 'debug' : 'info',
    defaultMeta: { service: 'ai-http-backend' },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: env.isDevelopment
                ? combine(
                    colorize({ all: true }),
                    timestamp({ format: 'HH:mm:ss' }),
                    devFormat
                )
                : combine(
                    timestamp(),
                    json()
                ),
        }),
    ],
});

// Add file transport in production
if (env.isProduction) {
    logger.add(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(timestamp(), json()),
        })
    );

    logger.add(
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: combine(timestamp(), json()),
        })
    );
}

// ==================== Helper Functions ====================

export const logRequest = (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
): void => {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `${method} ${path} ${statusCode} - ${duration}ms`, {
        method,
        path,
        statusCode,
        duration,
        userId,
    });
};

export const logError = (
    error: Error,
    context?: Record<string, unknown>
): void => {
    logger.error(error.message, {
        stack: error.stack,
        ...context,
    });
};

export const logAudit = (
    action: string,
    userId: string,
    resource: string,
    resourceId?: string,
    success = true,
    details?: Record<string, unknown>
): void => {
    logger.info(`AUDIT: ${action}`, {
        userId,
        resource,
        resourceId,
        success,
        ...details,
    });
};

// ==================== Stream for Morgan (optional) ====================

export const stream = {
    write: (message: string): void => {
        logger.info(message.trim());
    },
};

export default logger;
