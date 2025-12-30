// ============================================
// Main Entry Point
// ============================================

import { createApp } from './app.js';
import { env, logger, connectDatabase, connectRedis } from './config/index.js';

// ==================== Bootstrap ====================

const bootstrap = async (): Promise<void> => {
    try {
        // ASCII Art Banner
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     █████╗ ██╗      ██╗  ██╗████████╗████████╗██████╗         ║
║    ██╔══██╗██║      ██║  ██║╚══██╔══╝╚══██╔══╝██╔══██╗        ║
║    ███████║██║█████╗███████║   ██║      ██║   ██████╔╝        ║
║    ██╔══██║██║╚════╝██╔══██║   ██║      ██║   ██╔═══╝         ║
║    ██║  ██║██║      ██║  ██║   ██║      ██║   ██║             ║
║    ╚═╝  ╚═╝╚═╝      ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝             ║
║                                                               ║
║           مساعد HTTP الذكي لـ n8n                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

        logger.info('🚀 Starting AI-HTTP Backend...');
        logger.info(`📍 Environment: ${env.nodeEnv}`);

        // Connect to database
        logger.info('📦 Connecting to database...');
        await connectDatabase();

        // Connect to Redis (optional)
        logger.info('🔴 Connecting to Redis...');
        await connectRedis();

        // Create Express app
        const app = createApp();

        // Start server
        const server = app.listen(env.port, env.host, () => {
            logger.info(`✅ Server running on http://${env.host}:${env.port}`);
            logger.info(`📚 API available at http://${env.host}:${env.port}/api/v1`);
            logger.info(`💚 Health check at http://${env.host}:${env.port}/health`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string): Promise<void> => {
            logger.info(`\n📛 Received ${signal}. Shutting down gracefully...`);

            server.close(() => {
                logger.info('🔌 Server closed');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('⚠️ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// ==================== Start ====================

bootstrap().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
