import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.model';
import { Role } from './entities/role.model';
import { UserRole } from './entities/user_role.model';
import { Group } from './entities/group.model';
import { RoleGroup } from './entities/role-group.model';
import { UserGroup } from './entities/user-group.model';
import { Privilege } from './entities/privilege.model';
import { RolePrivilege } from './entities/role-privilege.model';

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
