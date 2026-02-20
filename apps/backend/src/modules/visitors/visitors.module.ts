import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitor } from '@/common/database/entities/visitor.entity';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { EmailsModule } from '@/modules/emails/emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visitor]),
    EmailsModule,
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
