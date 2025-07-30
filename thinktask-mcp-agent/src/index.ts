import readline from 'readline';
import axios from 'axios';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);

    // === 💡 your logic here ===
    // You can use your own local AI logic or call external API
    const task = {
      type: 'task',
      name: 'Example task from MCP',
      due_string: 'tomorrow at 12pm',
    };

    const result = {
      tools: ['todoist'],
      tool_calls: [
        {
          tool: 'todoist',
          input: {
            type: 'create_task',
            args: task,
          },
        },
      ],
    };

    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (e) {
    process.stderr.write(
      JSON.stringify({ error: 'Failed to parse input or generate response' }) +
        '\n',
    );
  }
});
