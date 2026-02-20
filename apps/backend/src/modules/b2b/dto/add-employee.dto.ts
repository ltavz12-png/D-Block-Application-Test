import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@/common/database/entities/user.entity';

export class AddEmployeeDto {
  @ApiProperty({ example: 'employee@company.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Giorgi', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Beridze', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '+995551234567', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    enum: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_EMPLOYEE],
    default: UserRole.COMPANY_EMPLOYEE,
    description: 'Role within the company',
  })
  @IsOptional()
  @IsEnum([UserRole.COMPANY_ADMIN, UserRole.COMPANY_EMPLOYEE], {
    message: 'role must be either company_admin or company_employee',
  })
  role?: UserRole.COMPANY_ADMIN | UserRole.COMPANY_EMPLOYEE =
    UserRole.COMPANY_EMPLOYEE;
}
