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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';
import { ResourceType } from '@/common/database/entities/resource.entity';

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // ──── Public endpoints ────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List resources with filters (public)' })
  findAll(@Query() query: QueryResourceDto) {
    return this.resourcesService.findAll(query);
  }

  @Public()
  @Get('location/:locationId')
  @ApiOperation({ summary: 'Get resources by location (public)' })
  @ApiQuery({ name: 'type', enum: ResourceType, required: false })
  findByLocation(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('type') type?: ResourceType,
  ) {
    return this.resourcesService.findByLocation(locationId, type);
  }

  // ──── Admin endpoints (must be before :id params to avoid route collision) ────

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Admin paginated list with all filters' })
  findAllAdmin(@Query() query: QueryResourceDto) {
    return this.resourcesService.findAll(query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Create a new resource' })
  create(
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.resourcesService.create(dto, user.id);
  }

  // ──── Parameterized public endpoints ────

  @Public()
  @Get(':id/availability')
  @ApiOperation({ summary: 'Get availability slots for a resource on a given date' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
  getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.resourcesService.getAvailabilitySlots(id, new Date(date));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single resource by ID (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.findById(id);
  }

  // ──── Admin parameterized endpoints ────

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Update a resource' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.resourcesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a resource' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.remove(id);
  }
}
