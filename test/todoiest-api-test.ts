import { AiService } from '../src/services/ai.service';
import { AppModule } from '../src/app.module';
import { NestFactory } from '@nestjs/core';
import { TasksService } from '../src/services/tasks.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);
  const tasksService = app.get(TasksService);

  const todoist_api_key = process.env.TODOIST_API_TOKEN;
  const anthropic_api_key = process.env.ANTHROPIC_API_KEY;

  if (!todoist_api_key) {
    throw new Error('TODOIST_API_TOKEN environment variable is required');
  }

  if (!anthropic_api_key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const testCases: { instruction: string }[] = [
    // Create project
    { instruction: 'Create a new project for personal stuff' },
    {
      instruction:
        'Create a new project cleaning appartment and plan a room cleanning plan for 2 rooms and kitchen',
    },

    // Add tasks
    { instruction: 'Add a task to call Adi tommorow ' },
    { instruction: 'Add a task to buy a book to the personal project' },
    {
      instruction: 'Add a task about a meeting with Ella and tag it as urgent',
    },

    // Add labels
    { instruction: 'Create a label named Leisure' },
    { instruction: 'Tag the task about calling Adi with the Phone label' },
    {
      instruction: 'Tag the task about buying the book with the Leisure label',
    },

    // Remove labels
    { instruction: 'Remove the Urgent label from the meeting task' },
    { instruction: 'Delete the label named Leisure' },

    // Complete
    { instruction: 'Mark the task to call Adi as done' },

    // Archive / delete
    { instruction: 'Delete the task about buying the book' },
    {
      instruction:
        'Delete the task about a meeting with Ella and tag it as urgent',
    },

    // Delete labels
    { instruction: 'Remove the label named Phone' },

    // Delete project
    { instruction: 'Delete the personal project' },
    { instruction: 'Delete the cleaning appartment project' },
  ];

  // Helper function to add delay between test cases to avoid rate limiting
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    // Add delay between test cases (except for the first one)
    if (i > 0) {
      console.log('⏳ Waiting 10 seconds to avoid rate limiting...');
      await delay(10000);
    }
    console.log('\n==============================');
    console.log(`📥 User Instruction: ${testCase.instruction}`);
    console.log('==============================');

    try {
      // Determine API endpoints needed by AI for this instruction
      const endpoints = await aiService.determineRequiredFetches(
        testCase.instruction,
        anthropic_api_key,
      );

      // Add delay between AI calls to avoid rate limiting
      console.log('⏳ Waiting 5 seconds between AI calls...');
      await delay(5000);

      // Fetch necessary data from Todoist API
      const preparationData = await tasksService.executeEndpoints(
        endpoints,
        todoist_api_key,
      );

      // Generate AI actions for the instruction
      const actions = await aiService.parseTask(
        testCase.instruction,
        preparationData,
        anthropic_api_key,
      );

      // Execute all generated actions on Todoist
      const results = await tasksService.executeActions(
        actions,
        todoist_api_key,
      );

      // Verify if all actions succeeded
      const allSuccess = Array.from(results.values()).every((r) => r.success);

      if (allSuccess) {
        console.log('✅ All actions executed successfully on Todoist');
      } else {
        console.log('❌ Some actions failed during execution:');
        for (const [id, res] of Array.from(results.entries())) {
          if (!res.success) {
            console.log(`  - Action ID ${id} failed with error: ${res.error}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ Test Failed with error:', err.message || err);
    }
  }

  await app.close();
}

bootstrap();
