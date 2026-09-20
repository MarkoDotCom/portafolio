import { STATUS_CODES } from 'node:http';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

// Cuerpo único para todos los errores de la API, según RFC 9457 (Problem Details).
// Los éxitos no se envuelven: el código HTTP ya dice que salió bien y el cuerpo es el recurso.
export interface ProblemDetails {
  type: string; // URI que identifica el tipo de problema; "about:blank" cuando basta con el status
  title: string; // Frase estándar del status ("Bad Request", "Not Found"...)
  status: number;
  detail: string; // Explicación legible para el usuario; siempre string
  instance: string; // Ruta que produjo el error
  errors?: string[]; // Solo en errores de validación con varias causas
}

const INTERNAL_ERROR_DETAIL = 'Error interno del servidor';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const problem = toProblemDetails(exception, req.originalUrl ?? req.url);

    if (problem.status >= 500) this.logger.error(exception instanceof Error ? exception.stack : exception);

    res.status(problem.status).type('application/problem+json').json(problem);
  }
}

export function toProblemDetails(exception: unknown, instance: string): ProblemDetails {
  if (!(exception instanceof HttpException)) {
    return problem(HttpStatus.INTERNAL_SERVER_ERROR, INTERNAL_ERROR_DETAIL, instance);
  }

  const status = exception.getStatus();
  const body = exception.getResponse();
  // Nest responde con string (`new NotFoundException('x')`) o con { statusCode, message, error }.
  // ValidationPipe manda `message` como string[] con una entrada por regla incumplida.
  const message = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;

  if (Array.isArray(message)) return { ...problem(status, message.join('. '), instance), errors: message };
  return problem(status, message ?? exception.message, instance);
}

function problem(status: number, detail: string, instance: string): ProblemDetails {
  return { type: 'about:blank', title: STATUS_CODES[status] ?? 'Error', status, detail, instance };
}
