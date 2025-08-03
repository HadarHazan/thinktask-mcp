import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        // This will use stderr thanks to your Logger.overrideLogger patch
        this.logger.log(`✅ ${method} ${url} - ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        // This will use stderr thanks to your Logger.overrideLogger patch
        this.logger.error(
          `❌ ${method} ${url} - ${duration}ms - ${error.message}`,
        );
        throw error;
      }),
    );
  }
}
