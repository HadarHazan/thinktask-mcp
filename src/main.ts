import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as os from 'os';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
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

  // Try to get the network IP address instead of just "localhost"
  const networkInterfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const iface of Object.values(networkInterfaces)) {
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        addresses.push(info.address);
      }
    }
  }

  const host = addresses[0] || 'localhost';

  logger.log(`🚀 ThinkTask MCP Service is running on: http://${host}:${port}`);
  logger.log(`📋 API Info: http://${host}:${port}/api/mcp`);
  logger.log(`🔧 Tools endpoint: http://${host}:${port}/api/mcp/tools`);
  logger.log(`❤️ Health check: http://${host}:${port}/api/mcp/health`);
}

bootstrap();
