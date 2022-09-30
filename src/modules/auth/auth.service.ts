// src/logical/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './modules/user/user.service';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { RegisterDto } from './dto/register.dto';
import { User } from './modules/user/entities/user.model';
import { UserStatus } from './modules/user/variables/user.status';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UserService) {}

  private readonly logger = new Logger(AuthService.name);

  async validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User>> {
    const user = await this.usersService.findOne(username);
    if (user) {
      const hashedPassword = user.passwd;
      const salt = user.passwdSalt;
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt);
      if (hashedPassword === hashPassword) {
        if (user.status === UserStatus.DEACTIVATED) {
          this.logger.error('用户未激活');
          throw new Error('用户未激活');
        } else if (user.status === UserStatus.DISABLED) {
          this.logger.error('用户已停用');
          throw new Error('用户已停用');
        }
        // 密码正确
        const { passwd, passwdSalt, ...result } = user.get({
          plain: true,
        });
        return result;
      } else {
        this.logger.error('密码错误');
        throw new Error('用户名或密码错误');
      }
    }
    // 查无此人
    this.logger.error('用户不存在');
    throw new Error('用户名或密码错误');
  }

  async register(registerDto: RegisterDto): Promise<void> {
    try {
      const user: Partial<User> = {};
      user.userName = registerDto.userName;
      user.nickName = registerDto.nickName;
      user.passwdSalt = makeSalt();
      user.passwd = encryptPassword(registerDto.password, user.passwdSalt);
      user.mobile = registerDto.mobile || undefined;
      user.email = registerDto.email || undefined;
      user.status = UserStatus.DEACTIVATED;
      await this.usersService.create(user);
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        const error = e.errors[0];
        if (error) {
          this.logger.error(error.message);
          switch (error.path) {
            case 'userName': {
              throw new Error('用户已存在');
            }
            case 'mobile': {
              throw new Error('手机号已存在');
            }
            case 'email': {
              throw new Error('邮箱已被绑定');
            }
            default: {
              throw new Error(error.message);
            }
          }
        } else {
          throw new Error(e.name);
        }
      }
      throw new Error(e.name ? e.name + e.message : e.message);
    }
  }

  async getProfile(userName: string): Promise<Partial<User>> {
    const user = await this.usersService.findOne(userName);
    if (user) {
      const { passwd, passwdSalt, ...result } = user.get({
        plain: true,
      });
      return result;
    }
    this.logger.error('用户不存在');
    throw new Error('用户不存在');
  }

  logout(userId: number, sid?: string) {
    if (userId == null) {
      return;
    }
    if (!sid) {
    }
    return;
  }
}
