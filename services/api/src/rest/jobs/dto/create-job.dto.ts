import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const;
export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];

export class JobSkillDto {
  @IsUUID()
  skillId: string;

  @IsBoolean()
  required: boolean;
}

export class CreateJobDto {
  @IsUUID()
  companyId: string;

  @IsString()
  @Length(3, 200)
  title: string;

  @IsString()
  @Length(10, 20000)
  description: string;

  @IsIn(EMPLOYMENT_TYPES)
  employmentType: EmploymentType;

  @IsIn(WORK_MODES)
  workMode: WorkMode;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  salaryCurrency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSkillDto)
  skills: JobSkillDto[] = [];
}
