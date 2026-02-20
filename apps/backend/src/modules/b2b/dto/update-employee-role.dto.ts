import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '@/common/database/entities/user.entity';

export class UpdateEmployeeRoleDto {
  @ApiProperty({
    enum: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_EMPLOYEE],
    example: UserRole.COMPANY_ADMIN,
    description: 'New role for the employee',
  })
  @IsEnum([UserRole.COMPANY_ADMIN, UserRole.COMPANY_EMPLOYEE], {
    message: 'role must be either company_admin or company_employee',
  })
  role: UserRole.COMPANY_ADMIN | UserRole.COMPANY_EMPLOYEE;
}
