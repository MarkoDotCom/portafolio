import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService, type UserSummary } from './users.service.js';

// Público: el selector de usuario y el alta se usan antes de "iniciar sesión"
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(): Promise<UserSummary[]> {
    return this.users.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto): Promise<UserSummary> {
    return this.users.create(dto);
  }
}
