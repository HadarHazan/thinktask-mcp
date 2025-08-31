import { AiService } from '../src/services/ai.service';
import { AppModule } from '../src/app.module';
import { NestFactory } from '@nestjs/core';
import { TasksService } from '../src/services/tasks.service';

// % yarn ts-node test/test-siri.ts
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const aiService = app.get(AiService);
  const tasksService = app.get(TasksService);

  // const userInstruction = 'תסמן שהמשימה לנקות את הבריטה בוצעה ';
  // const userInstruction = 'תמחק את הפרויקט מעבר דירה';
  // const userInstruction =
  //   'תוסיף לי משימה יומית לפרוקיט של טיפוח למרוח קרם הגנה כל בוקר';
  // const userInstruction =
  //   'Doctor appointment tomorrow at 10 AM, remind me in 1 hour to prepare, and schedule follow-up in 2 weeks at 4 PM';
  // (' moving on the 15th of the month – help me plan everything');
  // const userInstruction =
  //   'אני צריך שתפתח לי פרויקט לעשות מטבח ליוסי לעוד חודש אני צריך ללכת לקחת לו מדידות אני צריך להזמין חומרים אני צריך לעשות הדמיה את ההדמיה אני צריך לעשות כמה זמן לפני שבוע נגיד לפני שכבר יהיה הדמיה ואז ללכת ולהקים לו את המטבח';
  const userInstruction =
    'מחר אני צריכה לנקות את המטבח יסודי יש ארונות יש יש כיור יש מקרר שצריך לנקות יסודי ותנור ומיקרוגל';
  // const userInstruction = 'תפתח לי משימה למחר לנקות את הסלון';
  //  const userInstruction =
  //   'אני רוצה לתכנן טיול לשלושה ימים לאיטליה לי ולחברה שלי לרומא תפתח לי פרויקט תעזור לי לארגן את הטיו
  // const userInstruction =
  //   'תבנה לי פרויקט למעבר דירה שמתרחש עוד שלושה שבועות וצריך להכין תוכנית מסודרת לאריזה ולקראת מעבר לדירה של שלושה חדרי שינה מטבח ושירותים מקלחת וסלון';
  try {
    const todoist_api_key = process.env.TODOIST_API_TOKEN || '';
    const anthropic_api_key = process.env.ANTHROPIC_API_KEY || '';
    const endpoints = await aiService.determineRequiredFetches(
      userInstruction,
      anthropic_api_key,
    );
    console.log('⚡ Executing Todoist API endpointa...');
    const preparsionData = await tasksService.executeEndpoints(
      endpoints,
      todoist_api_key,
    );

    console.log('preparsionData', JSON.stringify(preparsionData, null, 2));
    console.log('Parsing user instruction...');
    const actions = await aiService.parseTask(
      userInstruction,
      preparsionData,
      anthropic_api_key,
    );
    console.log('AI generated actions:', JSON.stringify(actions, null, 2));

    console.log('Executing actions on Todoist...');
    const results = await tasksService.executeActions(
      actions,
      '0874c7d2fab96d9777b8ec0feae7c79ecd347fa0',
    );
    console.log('Results from Todoist:');
    for (const [id, data] of results.entries()) {
      console.log(`${id}:`, data);
    }
  } catch (err) {
    console.error(err);
  }

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
