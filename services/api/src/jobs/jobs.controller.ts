import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Auth, CurrentUser } from '../auth/auth.decorators.js';
import type { CurrentUserData } from '../auth/current-user.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobStatusDto } from './dto/update-job-status.dto.js';
import type { JobDto } from '../database/tables/job-posting.table.js';
import { JobsService } from './jobs.service.js';

@Auth()
@Controller()
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('jobs')
  list(): Promise<JobDto[]> {
    return this.jobs.listPublished();
  }

  @Get('jobs/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserData): Promise<JobDto> {
    return this.jobs.findOne(id, user);
  }

  @Auth('employer')
  @Get('companies/:companyId/jobs')
  listForCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<JobDto[]> {
    return this.jobs.listForCompany(companyId, user);
  }

  @Auth('employer')
  @Post('jobs')
  create(@Body() dto: CreateJobDto, @CurrentUser() user: CurrentUserData): Promise<JobDto> {
    return this.jobs.create(dto, user);
  }

  @Auth('employer')
  @Patch('jobs/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobStatusDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<JobDto> {
    return this.jobs.updateStatus(id, dto, user);
  }
}
