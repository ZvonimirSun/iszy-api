import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.model';
import { Role } from './entities/role.model';
import { UserRole } from './entities/user_role.model';

@Module({
  imports: [SequelizeModule.forFeature([User, Role, UserRole])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
