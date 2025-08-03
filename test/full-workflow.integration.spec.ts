import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { McpService } from '../src/services/mcp.service';
import { TasksService } from '../src/services/tasks.service';
import { AiService } from '../src/services/ai.service';

import * as dotenv from 'dotenv';
dotenv.config();

describe('Full Workflow Integration Tests', () => {
  let mcpService: McpService;

  const TODOIST_API_KEY = process.env.TODOIST_API_TOKEN;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  beforeAll(async () => {
    if (!TODOIST_API_KEY || !ANTHROPIC_API_KEY) {
      throw new Error('API keys required for integration tests');
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        HttpModule.register({ timeout: 30000 }),
      ],
      providers: [TasksService, AiService, McpService],
    }).compile();

    mcpService = module.get<McpService>(McpService);
  });

  // Test the actual scenarios from your test script with natural language
  const testCases = [
    { instruction: 'Create a new project for my personal stuff' },
    { instruction: 'I need to call Adi tomorrow, add that as a task' },
    { instruction: 'Add a task about buying a book to my personal project' },
    { instruction: 'Create a task for a meeting with Ella and make it urgent' },
    { instruction: 'Set up a leisure label for my hobbies' },
    { instruction: 'Tag the task about calling Adi with the phone label' },
    { instruction: 'The book task should be tagged as leisure' },
    { instruction: 'Remove the urgent tag from the meeting with Ella' },
    { instruction: 'I finished calling Adi, mark that task as done' },
    { instruction: 'Delete the task about buying the book' },
    { instruction: 'Remove the meeting task with Ella' },
    { instruction: 'Delete my phone label, I dont need it anymore' },
    { instruction: 'Remove my personal project completely' },
  ];

  testCases.forEach((testCase, index) => {
    it(`should handle: "${testCase.instruction}"`, async () => {
      // Act
      const result = await mcpService.handleToolCall({
        name: 'plan_intelligent_tasks',
        arguments: {
          instruction: testCase.instruction,
          todoist_api_key: TODOIST_API_KEY,
          anthropic_api_key: ANTHROPIC_API_KEY,
        },
      });

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('✅');
      expect(result.content[0].text).toContain('ThinkTask Planning Complete');

      console.log(`✅ Test case ${index + 1} completed:`, testCase.instruction);
      console.log('📄 Result summary:', result.content[0].text.split('\n')[0]);
    }, 60000); // 60 second timeout for each test
  });
});
