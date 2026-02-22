import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.findByIdOrFail(user.id).then((u) => {
      const { passwordHash, twoFactorSecret, ...safe } = u as any;
      return safe;
    });
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findByIdOrFail(id).then((u) => {
      const { passwordHash, twoFactorSecret, ...safe } = u as any;
      return safe;
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin)' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(id, dto);
  }
}
