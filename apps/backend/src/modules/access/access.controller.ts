import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AccessService } from './access.service';
import { GrantAccessDto } from './dto/grant-access.dto';
import { RevokeAccessDto } from './dto/revoke-access.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';
import { QueryAccessKeysDto } from './dto/query-access-keys.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Access Control')
@ApiBearerAuth()
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  // =================== STATIC ROUTES ===================

  @Get('keys')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'List access keys with filters' })
  async findAccessKeys(@Query() query: QueryAccessKeysDto) {
    return this.accessService.findAccessKeys(query);
  }

  @Get('keys/my')
  @Roles(
    UserRole.MEMBER,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.RECEPTION_STAFF,
    UserRole.SUPPORT_AGENT,
    UserRole.MARKETING_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get my active access keys' })
  async getMyActiveKeys(@CurrentUser() user: { id: string }) {
    return this.accessService.getUserActiveKeys(user.id);
  }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'List access logs with filters' })
  async findAccessLogs(@Query() query: QueryAccessLogsDto) {
    return this.accessService.findAccessLogs(query);
  }

  @Get('stats/:locationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Get access statistics for a location' })
  @ApiParam({ name: 'locationId', type: 'string', format: 'uuid' })
  async getAccessStats(
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ) {
    return this.accessService.getAccessStats(locationId);
  }

  @Post('grant')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Grant access to a user' })
  async grantAccess(@Body() dto: GrantAccessDto) {
    return this.accessService.grantAccess(dto);
  }

  @Post('sync-events')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Sync events from SaltoKS' })
  async syncSaltoEvents() {
    const synced = await this.accessService.syncSaltoEvents();
    return { synced };
  }

  // =================== PARAMETERIZED ROUTES ===================

  @Get('keys/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Get a single access key by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findAccessKey(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessService.findAccessKeyById(id);
  }

  @Post('keys/:id/revoke')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Revoke an access key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async revokeAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAccessDto,
  ) {
    return this.accessService.revokeAccess(id, dto.reason);
  }

  @Post('keys/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Suspend an access key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async suspendAccess(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessService.suspendAccess(id);
  }

  @Post('keys/:id/reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Reactivate a suspended access key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async reactivateAccess(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessService.reactivateAccess(id);
  }
}
