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

## 🔌 Connect to MCP Clients

### 🖥️ Claude Desktop

To use ThinkTask as an MCP tool in Claude Desktop, add the following to your `mcpServers` configuration:

```json
{
  "mcpServers": {
    "thinktask": {
      "command": "npx",
      "args": ["-y", "thinktask-mcp@latest"],
      "env": {
        "TODOIST_API_TOKEN": "your_todoist_api_token",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key"
      }
    }
  }
}
```

### ✅ Prerequisites

- **Node.js** 18 or newer
- A valid **Todoist API token** (found in your Todoist Integrations settings)
- **No manual installation needed** – `npx` will automatically download and run the latest version from npm

---

Once added, Claude Desktop will be able to call ThinkTask as a tool and return structured tasks directly to Todoist.

## 🔧 API Endpoints

- **GET** `/api/mcp` - Service information
- **GET** `/api/mcp/tools` - Available MCP tools
- **POST** `/api/mcp/call-tool` - Execute planning tool
- **GET** `/api/mcp/health` - Health check

```

## 🧪 Example Use Cases

- **📅 Event Planning**: "Plan my birthday party next month"
- **🏠 Moving**: "I'm moving to a new apartment in 3 weeks"
- **💼 Business Launch**: "Start my consulting business"
- **🎓 Education**: "Prepare for my final exams in December"
- **🎯 Personal Goals**: "Get in shape for summer"
- **🏠 Home Projects**: "Renovate my kitchen"

```

## 🏗️ Architecture

src/
├── config/ # Configuration and validation
├── controllers/ # HTTP controllers
├── services/ # Business logic
│ └── 🤖 AI Service Natural language → Structured JSON
│ └── 📋 Tasks Service (Todoist API) → Execute API calls with dependency resolution
│ └── 🔧 MCP Service → Handle MCP protocol and tool calls
└── 🌐 REST API
├── types/ # TypeScript type definitions
├── utils/ # Utility functions
├── exceptions/ # Custom error classes
└── **tests**/ # Test files

**Made with ❤️ for productivity enthusiasts who believe AI should think, not just automate.**
