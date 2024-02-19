import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '~entities/user/user.model';
import { Role } from '~entities/user/role.model';
import { UserRole } from '~entities/user/user_role.model';
import { Group } from '~entities/user/group.model';
import { RoleGroup } from '~entities/user/role-group.model';
import { UserGroup } from '~entities/user/user-group.model';
import { Privilege } from '~entities/user/privilege.model';
import { RolePrivilege } from '~entities/user/role-privilege.model';

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
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
