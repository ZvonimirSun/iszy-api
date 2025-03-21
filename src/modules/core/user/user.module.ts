import { Global, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Group, Privilege, Role, RoleGroup, RolePrivilege, User, UserGroup, UserRole } from '~entities/user'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Global()
@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Role,
      UserRole,
      Group,
      RoleGroup,
      UserGroup,
      Privilege,
      RolePrivilege,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
