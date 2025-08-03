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

  const testCases: { instruction: string }[] = [
    // Create project
    { instruction: 'Create a new project for personal stuff' },

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
    { instruction: 'Remove the task about calling Adi' },
    {
      instruction:
        'Delete the task about a meeting with Ella and tag it as urgent',
    },

    // Delete labels
    { instruction: 'Remove the label named Phone' },

    // Delete project
    { instruction: 'Delete the personal project' },
  ];

  for (const testCase of testCases) {
    console.log('\n==============================');
    console.log(`📥 User Instruction: ${testCase.instruction}`);
    console.log('==============================');

    try {
      // Determine API endpoints needed by AI for this instruction
      const endpoints = await aiService.determineRequiredFetches(
        testCase.instruction,
        anthropic_api_key,
      );

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

      // Track newly created projects by their name
      for (const action of actions) {
        if (
          action.endpoint === 'projects' &&
          action.method === 'POST' &&
          action.body &&
          typeof action.body === 'object' &&
          'name' in action.body
        ) {
          const body = action.body as { name: string };
        }
      }

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
        for (const [id, res] of results.entries()) {
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
