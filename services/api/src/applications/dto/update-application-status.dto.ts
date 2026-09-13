import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const EMPLOYER_STATUS_TARGETS = ['reviewing', 'interview', 'offer', 'rejected'] as const;

export class UpdateApplicationStatusDto {
  @IsIn(EMPLOYER_STATUS_TARGETS)
  status: (typeof EMPLOYER_STATUS_TARGETS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
