import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PassesService } from './passes.service';
import { PurchasePassDto } from './dto/purchase-pass.dto';
import { QueryPassDto } from './dto/query-pass.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Passes')
@ApiBearerAuth()
@Controller('passes')
export class PassesController {
  constructor(private readonly passesService: PassesService) {}

  // ─── Member Endpoints ─────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Purchase a new pass' })
  async purchasePass(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Body() dto: PurchasePassDto,
  ) {
    return this.passesService.purchasePass(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my passes' })
  async myPasses(
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.passesService.findByUser(user.id);
  }

  @Get('my/active')
  @ApiOperation({ summary: 'Get my active passes' })
  async myActivePasses(
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.passesService.findActiveByUser(user.id);
  }

  // ─── Admin Endpoints ──────────────────────────────────────────

  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.LOCATION_MANAGER)
  @Get('admin')
  @ApiOperation({ summary: 'Paginated list of all passes with filters (admin)' })
  async findAllAdmin(@Query() query: QueryPassDto) {
    return this.passesService.findAll(query);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a pass (admin)' })
  async activatePass(@Param('id', ParseUUIDPipe) id: string) {
    return this.passesService.activatePass(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a pass (admin)' })
  async suspendPass(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.passesService.suspendPass(id, reason);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew a pass (admin)' })
  async renewPass(@Param('id', ParseUUIDPipe) id: string) {
    return this.passesService.renewPass(id);
  }

  // ─── Single Pass (must come after /admin and /my routes) ──────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single pass (owner or admin)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    const pass = await this.passesService.findById(id);

    const adminRoles: string[] = [
      UserRole.SUPER_ADMIN,
      UserRole.FINANCE_ADMIN,
      UserRole.LOCATION_MANAGER,
    ];

    if (pass.userId !== user.id && !adminRoles.includes(user.role)) {
      throw new ForbiddenException('You can only view your own passes');
    }

    return pass;
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pass (owner only)' })
  async cancelPass(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
    @Body('reason') reason?: string,
  ) {
    return this.passesService.cancelPass(id, user.id, reason);
  }
}
