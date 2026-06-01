import { env } from './config/env';
import { buildApp } from './app';
import { logger } from './utils/logger';

const start = async () => {
  try {
    const app = await buildApp();
    const port = parseInt(env.PORT, 10);

    await app.listen({ port, host: '0.0.0.0' });

    logger.info(`🚀 Weaz AI API running on http://0.0.0.0:${port}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
    logger.info(`   Health check: http://0.0.0.0:${port}/health`);
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
};

start();
