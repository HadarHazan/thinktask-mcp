import { Controller, Get } from '@nestjs/common';
import { AiService } from 'src/services/ai.service';
import { TasksService } from 'src/services/tasks.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    };
  }
}
