import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';
// Import relevant entities

@Module({
  imports: [
    // TypeOrmModule.forFeature([MigrationLog]),
  ],
  controllers: [MigrationController],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
