import { ConflictException, Injectable } from '@nestjs/common';
import { AppUserTable, type AppUserWithRoles } from '../../database/tables/app-user.table.js';
import { CreateUserDto } from './dto/create-user.dto.js';

export type UserRole = 'worker' | 'employer';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  headline: string | null;
  roles: UserRole[];
  companies: { id: string; name: string; role: 'owner' | 'recruiter' }[];
}

function toSummary(u: AppUserWithRoles): UserSummary {
  const roles: UserRole[] = [];
  if (u.isWorker) roles.push('worker');
  if (u.companies.length > 0) roles.push('employer');
  return { id: u.id, fullName: u.fullName, email: u.email, headline: u.headline, roles, companies: u.companies };
}

@Injectable()
export class UsersService {
  constructor(private readonly users: AppUserTable) {}

  async findAll(): Promise<UserSummary[]> {
    const users = await this.users.listWithRoles();
    return users.map(toSummary);
  }

  async create(dto: CreateUserDto): Promise<UserSummary> {
    if (await this.users.existsByEmail(dto.email)) throw new ConflictException('Ya existe un usuario con ese email');

    const isWorker = dto.role === 'worker';
    const user = await this.users.create({
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      headline: isWorker ? (dto.headline ?? null) : null,
      location: isWorker ? (dto.location ?? null) : null,
      openToWork: isWorker ? (dto.openToWork ?? false) : false,
      companyName: isWorker ? null : (dto.companyName ?? null),
    });
    return toSummary(user);
  }
}
