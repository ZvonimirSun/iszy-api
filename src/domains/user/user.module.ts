import { Global, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Group, Privilege, Role, RoleGroup, RolePrivilege, User, UserGroup, UserRole } from './entities'
import { GroupController } from './group.controller'
import { MeController } from './me.controller'
import { PrivilegeController } from './privilege.controller'
import { RoleController } from './role.controller'
import { UserStore } from './store/user-store'
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
  controllers: [MeController, UserController, RoleController, GroupController, PrivilegeController],
  providers: [UserService, UserStore],
  exports: [UserService],
})
export class UserModule {}
