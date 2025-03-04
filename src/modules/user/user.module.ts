import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Group } from '~entities/user/group.model'
import { Privilege } from '~entities/user/privilege.model'
import { RoleGroup } from '~entities/user/role-group.model'
import { RolePrivilege } from '~entities/user/role-privilege.model'
import { Role } from '~entities/user/role.model'
import { UserGroup } from '~entities/user/user-group.model'
import { User } from '~entities/user/user.model'
import { UserRole } from '~entities/user/user_role.model'
import { UserController } from '~modules/user/user.controller'
import { UserService } from './user.service'

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
