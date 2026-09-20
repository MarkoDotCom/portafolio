import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length, MaxLength, ValidateIf } from 'class-validator';

export const USER_ROLES = ['worker', 'employer'] as const;
export type NewUserRole = (typeof USER_ROLES)[number];

export class CreateUserDto {
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  @Length(2, 200)
  fullName: string;

  @IsIn(USER_ROLES)
  role: NewUserRole;

  // Solo trabajador
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsBoolean()
  openToWork?: boolean;

  // Solo empleador: nombre de la empresa que se crea con el usuario como owner
  @ValidateIf((dto: CreateUserDto) => dto.role === 'employer')
  @IsString()
  @Length(2, 200)
  companyName?: string;
}
