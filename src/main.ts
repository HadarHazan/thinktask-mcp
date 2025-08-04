import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import { validateAnthropicConfig } from './config/anthropic.config.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate configuration
  validateAnthropicConfig();

  const app = await NestFactory.create(AppModule);

  // Enable CORS for MCP clients
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(
    `🚀 ThinkTask MCP Service is running on: http://localhost:${port}`,
  );
  logger.log(`📋 API Info: http://localhost:${port}/api/mcp`);
  logger.log(`🔧 Tools endpoint: http://localhost:${port}/api/mcp/tools`);
  logger.log(`❤️ Health check: http://localhost:${port}/api/mcp/health`);
}
bootstrap();
