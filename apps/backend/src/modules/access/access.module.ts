import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { SaltoKsMockGateway } from './gateways/salto-ks-mock.gateway';
import { SaltoKsGateway } from './gateways/salto-ks.gateway';
import { AccessKey } from '@/common/database/entities/access-key.entity';
import { AccessLog } from '@/common/database/entities/access-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccessKey, AccessLog])],
  controllers: [AccessController],
  providers: [AccessService, SaltoKsMockGateway, SaltoKsGateway],
  exports: [AccessService],
})
export class AccessModule {}
