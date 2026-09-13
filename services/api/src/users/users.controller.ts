import { Controller, Get } from '@nestjs/common';
import { UsersService, type UserSummary } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(): Promise<UserSummary[]> {
    return this.users.findAll();
  }
}
