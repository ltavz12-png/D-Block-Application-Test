import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MigrationService } from './migration.service';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}
}
