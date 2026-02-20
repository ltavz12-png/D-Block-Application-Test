import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Static routes BEFORE parameterized routes ────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Admin: list all notifications with filters and pagination' })
  async findAll(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAllNotifications(query);
  }

  @Get('my')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Get current user notifications with filters and pagination' })
  async findMyNotifications(
    @CurrentUser() user: { id: string },
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findUserNotifications(user.id, query);
  }

  @Get('my/unread-count')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get('my/preferences')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Get current user notification preferences' })
  async getMyPreferences(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUserPreferences(user.id);
  }

  @Post('send')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Admin: send a notification to a specific user' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  @Post('broadcast')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Admin: broadcast notification to multiple or all users' })
  async broadcastNotification(@Body() dto: SendBulkNotificationDto) {
    return this.notificationsService.sendBulkNotification(dto);
  }

  @Patch('my/preferences')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Update current user notification preferences' })
  async updateMyPreferences(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updateUserPreferences(user.id, dto);
  }

  @Post('my/read-all')
  @HttpCode(HttpStatus.OK)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  // ─── Parameterized routes ─────────────────────────────────────────────

  @Patch(':id/read')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Mark a single notification as read (ownership check)' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Soft delete a notification (ownership check)' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.deleteNotification(id, user.id);
  }
}
