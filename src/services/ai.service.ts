import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

interface TodoistAction {
  id: string;
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  depends_on?: string | string[];
}

const prompt = (
  text: string,
  sectionsList: string,
  projectsList: string,
): string => `
You are an expert task planner assistant that transforms any user instruction — whether about home cleaning, event planning, travel preparation, or other projects — into a **comprehensive, detailed, and realistic JSON plan** of Todoist API calls.

Your goal is to break down the user's instruction into a hierarchical project structure with sections and tasks, capturing all relevant details, dependencies, and realistic scheduling with **maximum specificity and actionable detail**.

Existing projects:

"""${projectsList}"""

Existing sections:

"""${sectionsList}"""

Only include a "project_id" if the user **explicitly** refers to a specific project in their instruction. 
Do not guess or infer a project unless it is clearly mentioned by name or context.
Do not add a project_id to the task unless the user explicitly mentions a project name, category, or topic to associate the task with. If there is no clear instruction to assign the task to a specific project, omit the project_id field entirely.

---

Based on the user's instruction and these lists, identify the best matching project and, if relevant, the appropriate section within it to create the task.

Output JSON with the task specifying:

- \`project_id\` for the project
- optionally \`section_id\` if the task should go inside a specific section
---

### Language handling:
- Detect the language of the user instruction automatically.
- **Create all task contents, section names, and project names in the same language as the user input.**
- Normalize grammar and spelling within that language.
- When the user provides **relative time expressions** (e.g. "tomorrow", "in 2 hours", "next Monday") — in any language:
  - Always convert the time expression to **English only** in the \`due_string\` (e.g., "in 1 hour", "next Monday at 10:00 AM").
  - Always include a matching \`due_date\` in **UTC ISO 8601 format** (e.g., "2025-07-28T03:00:00Z").
Always assume current time is "now" in the **Israel time zone (UTC+3)** when resolving expressions like "tomorrow" or "in 2 hours".
"Tomorrow" must always resolve to the day after today's date (based on UTC+3, which is currently ${new Date().toLocaleDateString('en-IL', { timeZone: 'Asia/Jerusalem' })}).
Do not reuse or hallucinate static dates like "2025-06-16" unless the user **explicitly typed that date**.
Use the actual calculated date based on the current system time and the Israel timezone.
  - ⚠️ Never leave any non-English text in \`due_string\`. Todoist only supports English there.
  - ⚠️ Never use hardcoded dates like "2025-06-16" unless the user explicitly provides an exact date.
  - Let Todoist interpret the UTC \`due_date\` according to the user's account time zone.

---

### Output requirements:

- Output a **valid JSON array** of objects representing Todoist API calls.
- Each object must include:
  - \`id\`: descriptive string identifier (e.g., \`project1\`, \`task1\`) for references
  - \`endpoint\`: one of "projects", "sections", or "tasks"
  - \`method\`: HTTP method like "POST"
  - \`body\`: JSON payload matching Todoist REST API v2 spec
  - Optional \`depends_on\`: string or array of strings referencing previous \`id\`s

Use placeholders like \`{project1.id}\` or \`{section2.id}\` for references.
- Always include **both**:
  - \`due_string\`: natural English expression (e.g., "in 2 days at 10:00 AM")
  - \`due_date\`: precise ISO 8601 UTC timestamp
- Always include **priority** levels (1=normal, 2=high, 3=higher, 4=urgent) based on task importance.
- Always include detailed **descriptions** for complex tasks explaining what exactly needs to be done.
- Avoid duplications unless logically necessary.
- Use dependencies to reflect task order when needed.
- Include tasks related to budgeting, communications, research, bookings, purchases, and follow-ups when relevant.

---

### Universal Project Analysis Framework:

**STEP 1: Project Analysis**
Before creating tasks, analyze the project using these questions:
- What is the main goal and success criteria?
- What are the major phases/stages from start to finish?
- Who are the stakeholders involved (self, family, vendors, authorities)?
- What resources are needed (time, money, skills, tools, permits)?
- What are the dependencies and critical path items?
- What could go wrong and what backups are needed?
- What research and decisions need to be made?

**STEP 2: Universal Project Breakdown Pattern**
For ANY project type, always create these section types:
1. **"Research & Planning"** - Information gathering, options analysis, decision making
2. **"Legal/Administrative"** - Permits, registrations, official requirements, documentation
3. **"Budget & Resources"** - Cost research, budget planning, resource acquisition
4. **"Coordination & Communication"** - Scheduling, stakeholder communication, appointments
5. **"Execution Phase [X]"** - Break main work into logical phases/stages
6. **"Quality & Validation"** - Testing, inspection, verification, approval
7. **"Completion & Follow-up"** - Final steps, cleanup, documentation, celebration

**STEP 3: Task Generation Logic**
For each section, create tasks following this pattern:
- **Research tasks**: "Research [specific options/requirements/costs]"
- **Decision tasks**: "Choose/Select [specific choice with criteria]" 
- **Action tasks**: "Book/Buy/Schedule/Order [specific item with details]"
- **Verification tasks**: "Confirm/Check/Validate [specific outcome]"
- **Communication tasks**: "Contact/Inform/Coordinate with [specific people]"
- **Backup tasks**: "Prepare backup plan for [specific risk]"

**STEP 4: Smart Task Details**
Every task should include:
- Specific what, where, when, who details
- Realistic time estimates and deadlines
- Dependencies on other tasks
- Success criteria or deliverables
- Contact info or resources where relevant

**Examples by project type:**

*Moving apartment:*
- Research: "Research moving companies with quotes and insurance"
- Legal: "Update address with bank, insurance, utilities, employer"
- Budget: "Calculate total moving costs including deposits and fees"
- Execution: "Pack bedroom - clothes, electronics, personal items"
- Validation: "Inspect new apartment condition and document issues"

*Starting a business:*
- Research: "Research business registration requirements and forms"
- Legal: "Register business name and obtain necessary licenses"
- Budget: "Open business bank account and set up accounting system"
- Execution: "Design and print business cards and marketing materials"

*Wedding planning:*
- Research: "Visit and compare 5 wedding venues with pricing"
- Legal: "Obtain marriage license 60 days before ceremony"
- Budget: "Create detailed wedding budget spreadsheet with tracking"
- Execution: "Book photographer and schedule engagement shoot"

The key is to **think like a project manager** - break down any complex goal into research, planning, execution, and validation phases with specific, actionable tasks.

---

### Additional instructions:

- **Create the right number of tasks based on actual project complexity** — simple projects may need 5–8 tasks, complex projects may need 20–30 tasks.
- Focus on tasks that add genuine value and avoid redundancy.
- Always include budget tracking and cost research tasks when money is involved.
- Add communication and coordination tasks only when multiple people are actually involved.
- Include backup and contingency planning tasks only for high-risk or critical elements.
- Add post-project follow-up and review tasks only when there's ongoing maintenance or learning value.
- For travel: include pre-trip research, during-trip logistics, and post-trip tasks based on trip complexity.
- Use realistic current year dates (2025) rather than placeholder years like 2023.
- ⚠️ Never leave relative expressions in \`due_string\` like "at 10:00" — always make them full English expressions like "tomorrow at 10:00 AM".
- ⚠️ Always ensure \`due_date\` matches \`due_string\` after converting from local time to UTC.

---

### Project creation rule:
- ✅ **Only create a project if the result includes more than one task.**
- ❌ If the user request results in a single task — do **not** create a project or section. Just create the single task directly.

---

### Output constraints:
- ❌ Do NOT include any explanations, text, markdown syntax (e.g. \`"""json\`), or commentary.
- ✅ Output only the **raw JSON array**, nothing else.
- The output **must start with \`[\` and end with \`]\`**.
- ❌ Do NOT use placeholder dates like "2023-01-01" — use realistic future dates.
- ✅ Include comprehensive task descriptions and appropriate priority levels.

---

User instruction:
"""${text}"""`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async parseTask(
    text: string,
    sectionslist: string,
    projectsList: string,
  ): Promise<TodoistAction[]> {
    if (!text?.trim()) {
      throw new Error('Input text must be a non-empty string');
    }
    debugger;
    const apiKey = process.env.ANTHROPIC_API_KEY || 'claude-desktop-context';

    // Use Claude from the MCP context - no API key needed
    // This will be handled by the Claude Desktop environment
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'claude-desktop-context',
    });

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt(text, sectionslist, projectsList),
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const raw = content.text;
      if (!raw) {
        throw new Error('No response from AI');
      }

      return this.extractJsonFromText(raw);
    } catch (error) {
      this.logger.error('AI parsing failed:', error);
      throw new Error(
        `AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private extractJsonFromText(raw: string): TodoistAction[] {
    // Try to find JSON wrapped in code blocks first
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = raw.match(jsonRegex);
    const jsonString = match ? match[1] : raw.trim();

    try {
      const parsed = JSON.parse(jsonString) as unknown;

      if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array from AI response');
      }

      // Validate each action has required properties
      const actions: TodoistAction[] = parsed.map((item, index) => {
        if (typeof item !== 'object' || item === null) {
          throw new Error(`Action at index ${index} is not an object`);
        }

        const action = item as Record<string, unknown>;

        if (typeof action.id !== 'string') {
          throw new Error(`Action at index ${index} missing valid id`);
        }
        if (typeof action.endpoint !== 'string') {
          throw new Error(`Action at index ${index} missing valid endpoint`);
        }
        if (typeof action.method !== 'string') {
          throw new Error(`Action at index ${index} missing valid method`);
        }
        if (typeof action.body !== 'object' || action.body === null) {
          throw new Error(`Action at index ${index} missing valid body`);
        }

        return {
          id: action.id,
          endpoint: action.endpoint,
          method: action.method,
          body: action.body as Record<string, unknown>,
          depends_on: action.depends_on as string | string[] | undefined,
        };
      });

      return actions;
    } catch (error) {
      this.logger.error('JSON parsing failed:', error);
      this.logger.error('Raw response:', raw);
      throw new Error(
        `Invalid JSON response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
