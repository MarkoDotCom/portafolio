import { IsIn } from 'class-validator';

export const JOB_STATUS_TARGETS = ['published', 'closed'] as const;

export class UpdateJobStatusDto {
  @IsIn(JOB_STATUS_TARGETS)
  status: (typeof JOB_STATUS_TARGETS)[number];
}
