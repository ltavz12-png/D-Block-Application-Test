import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '@/common/database/entities/user.entity';
import { UserAuthProvider } from '@/common/database/entities/user-auth-provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuthProvider]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
