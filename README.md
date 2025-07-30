# 🎯 ThinkTask: Intelligent Todoist MCP Service

> Transform any natural language instruction into perfect Todoist structure

## Why ThinkTask?

Traditional task management tools just create basic tasks. ThinkTask uses AI to understand your goals and creates comprehensive project structures with intelligent scheduling, dependencies, and organization.

**Traditional approach:**

```
"Add task: Call mom" → Creates one basic task
```

**ThinkTask approach:**

```
"Call mom tomorrow at 2pm" → Creates scheduled task with proper timing
"Plan my wedding for May 15" → Creates complete wedding project with venues, catering, photography, legal, budget sections and 20+ organized tasks
"Launch my consulting business" → Creates business launch project with research, legal, marketing, operations phases
```

## 🌟 Features

- **🤖 AI-Powered Planning**: Uses Claude 3.5 Sonnet for intelligent task breakdown
- **🗣️ Natural Language**: Just describe what you want to accomplish
- **📅 Smart Scheduling**: Understands "tomorrow", "next week", "two months before", etc.
- **🌍 Multi-Language**: Supports multiple languages with proper timezone handling
- **🔗 Dependency Resolution**: Creates tasks in the right order
- **📊 Project Structure**: Automatically creates projects, sections, and tasks as needed

## 🚀 Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your Anthropic API key (optional)
```

### 3. Build and Run

```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod

# MCP Server
yarn build
yarn start:mcp
```

## 🔧 API Endpoints

- **GET** `/api/mcp` - Service information
- **GET** `/api/mcp/tools` - Available MCP tools
- **POST** `/api/mcp/call-tool` - Execute planning tool
- **GET** `/api/mcp/health` - Health check

## 🛠️ MCP Tool: `plan_intelligent_tasks`

Transform natural language into comprehensive Todoist structures.

### Parameters:

- `instruction` (required): What you want to accomplish
- `todoist_api_key` (required): Your Todoist API key
- `anthropic_api_key` (optional): Claude API key if not set in environment

### Examples:

#### Simple Task

```json
{
  "name": "plan_intelligent_tasks",
  "arguments": {
    "instruction": "Call mom tomorrow at 2pm",
    "todoist_api_key": "your_todoist_key"
  }
}
```

#### Complex Project

```json
{
  "name": "plan_intelligent_tasks",
  "arguments": {
    "instruction": "Plan my wedding for May 15 - I need to organize everything from venue to catering",
    "todoist_api_key": "your_todoist_key"
  }
}
```

## 🔌 Connect to MCP Clients

### Claude Desktop

Add to your MCP settings:

```json
{
  "mcpServers": {
    "thinktask": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-fetch",
        "http://your-domain.com/api/mcp"
      ]
    }
  }
}
```

### Direct MCP Server

```bash
yarn start:mcp
```

## 🏗️ Architecture

```
ThinkTask MCP Service
├── 🤖 AI Service (Claude 3.5 Sonnet)
│   └── Natural language → Structured JSON
├── 📋 Tasks Service (Todoist API)
│   └── Execute API calls with dependency resolution
├── 🔧 MCP Service
│   └── Handle MCP protocol and tool calls
└── 🌐 REST API
    └── HTTP endpoints for direct access
```

## 📁 Project Structure

```
src/
├── controllers/
│   └── mcp.controller.ts      # MCP REST endpoints
├── services/
│   ├── ai.service.ts          # Claude AI integration
│   ├── tasks.service.ts       # Todoist API handling
│   └── mcp.service.ts         # MCP protocol logic
├── dto/
│   └── mcp.dto.ts            # Data transfer objects
├── config/
│   └── anthropic.config.ts    # AI configuration
├── main.ts                    # NestJS application entry
└── mcp-server.ts             # Standalone MCP server
```

## 🔑 API Keys

### Todoist API Key

1. Go to Todoist Settings
2. Navigate to Integrations
3. Find "API token" and copy it

### Anthropic API Key (Optional)

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Set as `ANTHROPIC_API_KEY` environment variable
4. Or provide per-request in tool calls

## 🌍 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start:prod"]
```

### Environment Variables

```bash
ANTHROPIC_API_KEY=your_key_here
PORT=3000
NODE_ENV=production
```

## 🧪 Example Use Cases

- **📅 Event Planning**: "Plan my birthday party next month"
- **🏠 Moving**: "I'm moving to a new apartment in 3 weeks"
- **💼 Business Launch**: "Start my consulting business"
- **🎓 Education**: "Prepare for my final exams in December"
- **🎯 Personal Goals**: "Get in shape for summer"
- **🏠 Home Projects**: "Renovate my kitchen"

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋‍♂️ Support

- Create an issue for bugs or feature requests
- Check existing issues before creating new ones
- Provide detailed information about your use case

---

**Made with ❤️ for productivity enthusiasts who believe AI should think, not just automate.**
