import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // ─── Public Endpoints ───────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active locations (public)' })
  async findActive() {
    return this.locationsService.findActive();
  }

  // ─── Admin Endpoints ────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @Get('admin')
  @ApiOperation({ summary: 'Paginated list of locations with filters (admin)' })
  async findAllAdmin(@Query() query: QueryLocationDto) {
    return this.locationsService.findAll(query);
  }

  // ─── Public (by ID, must come after /admin) ─────────────────────

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single location with resource counts (public)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const location = await this.locationsService.findById(id);
    const resourceCounts = await this.locationsService.getResourceCounts(id);

    return { ...location, resourceCounts };
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  async create(
    @Body() dto: CreateLocationDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.locationsService.create(dto, user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.locationsService.update(id, dto, user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.locationsService.remove(id);
    return { message: 'Location deleted successfully' };
  }
}
