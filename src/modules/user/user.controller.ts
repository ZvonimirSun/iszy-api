import { ApiTags } from '@nestjs/swagger'
import { Controller, Get, UseGuards } from '@nestjs/common'
import { UserService } from '~modules/user/user.service'
import { Roles } from '~core/decorator/roles.decorator'
import { RoleEnum } from '~core/enum/role.enum'
import { RolesGuard } from '~core/guard/roles.guard'
import { CustomAuthGuard } from '~core/guard/custom-auth.guard'

@ApiTags('User')
@Roles(RoleEnum.ADMIN, RoleEnum.SUPERADMIN)
@UseGuards(CustomAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('test')
  test() {
    return 'test'
  }
}
