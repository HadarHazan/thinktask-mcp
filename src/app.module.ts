import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './controllers/app.controller';
import { AppService } from './app.service';
import { McpController } from './controllers/mcp.controller';
import { AiService } from './services/ai.service';
import { TasksService } from './services/tasks.service';
import { McpService } from './services/mcp.service';
import { SiriTasksController } from './controllers/siri-tasks.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AppController, McpController, SiriTasksController],
  providers: [AppService, AiService, TasksService, McpService],
})
export class AppModule {}
