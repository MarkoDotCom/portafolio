import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Auth, CurrentUser } from '../auth/auth.decorators.js';
import type { CurrentUserData } from '../auth/current-user.js';
import type { ApplicantDto, ApplicationDto } from '../../database/tables/job-application.table.js';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

@Auth()
@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Auth('worker')
  @Post('jobs/:id/applications')
  apply(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApplicationDto> {
    return this.applications.apply(jobId, dto, user);
  }

  @Auth('worker')
  @Get('applications/mine')
  listMine(@CurrentUser() user: CurrentUserData): Promise<ApplicationDto[]> {
    return this.applications.listMine(user);
  }

  @Auth('worker')
  @Post('applications/:id/withdraw')
  withdraw(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserData): Promise<ApplicationDto> {
    return this.applications.withdraw(id, user);
  }

  @Auth('employer')
  @Get('jobs/:id/applications')
  listForJob(@Param('id', ParseUUIDPipe) jobId: string, @CurrentUser() user: CurrentUserData): Promise<ApplicantDto[]> {
    return this.applications.listForJob(jobId, user);
  }

  @Auth('employer')
  @Patch('applications/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApplicantDto> {
    return this.applications.updateStatus(id, dto, user);
  }
}
