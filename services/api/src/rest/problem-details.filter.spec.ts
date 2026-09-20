import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { toProblemDetails } from './problem-details.filter.js';

describe('toProblemDetails', () => {
  it('maps a Nest exception with a single message', () => {
    expect(toProblemDetails(new NotFoundException('Oferta no encontrada'), '/jobs/1')).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Oferta no encontrada',
      instance: '/jobs/1',
    });
  });

  it('joins validation messages into detail and keeps them in errors', () => {
    const validation = new BadRequestException({
      statusCode: 400,
      message: ['title should not be empty', 'skills must be an array'],
      error: 'Bad Request',
    });
    expect(toProblemDetails(validation, '/jobs')).toMatchObject({
      status: 400,
      detail: 'title should not be empty. skills must be an array',
      errors: ['title should not be empty', 'skills must be an array'],
    });
  });

  it('falls back to the exception message when the body has none', () => {
    expect(toProblemDetails(new HttpException({ ok: false }, 418), '/tea')).toMatchObject({
      status: 418,
      title: "I'm a Teapot",
      detail: 'Http Exception',
    });
  });

  it('hides the cause of unexpected errors behind a 500', () => {
    expect(toProblemDetails(new Error('connection refused to db:5432'), '/health')).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Error interno del servidor',
      instance: '/health',
    });
  });
});
